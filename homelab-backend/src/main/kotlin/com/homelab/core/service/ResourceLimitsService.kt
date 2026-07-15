package com.homelab.core.service

import com.homelab.core.exception.BadRequestException
import com.homelab.core.helper.DiskUsage
import com.homelab.core.model.system.ResourceLimits
import com.homelab.core.model.system.ResourceLimitsRepository
import com.homelab.sdk.helper.AppLogger
import com.homelab.sdk.helper.Formater
import java.io.IOException
import java.nio.file.Files
import java.nio.file.Path
import java.time.LocalDateTime
import kotlin.math.floor
import kotlin.math.max
import org.springframework.core.env.Environment
import org.springframework.stereotype.Service
import oshi.SystemInfo

/**
 * Owner-configurable resource caps for the homelab (core app + modules).
 *
 * Deliberately independent from TelemetryService/ModuleService (both already depend on each
 * other transitively) to avoid a circular Spring dependency, since ModuleService needs to call
 * [checkDiskQuota] before writing new module files to disk. Its own tiny OSHI/filesystem lookup
 * for machine capacity duplicates a couple of one-liners already in TelemetryService rather than
 * depending on it, for the same reason.
 *
 * maxDiskGb is enforced live, on every write path. maxRamGb can't be: the JVM heap ceiling is
 * fixed at process start, so setting it here only mirrors JAVA_XMX_GB into the .env file consumed
 * by docker-compose (see [writeJavaXmxToEnvFile]) - the owner still needs to recreate the
 * container for a new -Xmx to take effect.
 */
@Service
class ResourceLimitsService(
    private val repository: ResourceLimitsRepository,
    private val env: Environment,
) {
    private val log = AppLogger.loggerFor(ResourceLimitsService::class)
    private val hal = SystemInfo().hardware

    private fun current(): ResourceLimits = repository.findAll().firstOrNull() ?: ResourceLimits()

    private fun machineMaxRamGb(): Double = Formater.round(Formater.bytesToGigabytes(hal.memory.total), 2)

    private fun machineMaxDiskGb(): Double {
        val fileStore = Files.getFileStore(Path.of("").toAbsolutePath().normalize())
        return Formater.round(Formater.bytesToGigabytes(fileStore.totalSpace), 2)
    }

    fun status(): Map<String, Any> {
        val limits = current()
        val usage = DiskUsage.current()
        val activeMaxRamGb = Formater.round(Formater.bytesToGigabytes(Runtime.getRuntime().maxMemory()), 2)
        return mapOf(
            "maxRamGb" to limits.maxRamGb,
            "maxDiskGb" to limits.maxDiskGb,
            "activeMaxRamGb" to activeMaxRamGb,
            "usedDiskGb" to Formater.round(Formater.bytesToGigabytes(usage.totalBytes), 3),
            "ramRestartRequired" to (Formater.round(limits.maxRamGb, 1) != Formater.round(activeMaxRamGb, 1)),
            "machineMaxRamGb" to machineMaxRamGb(),
            "machineMaxDiskGb" to machineMaxDiskGb(),
        )
    }

    fun updateLimits(maxRamGb: Double, maxDiskGb: Double): Map<String, Any> {
        if (maxRamGb <= 0.0) throw BadRequestException("La limite de RAM doit être positive")
        if (maxDiskGb <= 0.0) throw BadRequestException("La limite de disque doit être positive")

        val machineMaxRam = machineMaxRamGb()
        val machineMaxDisk = machineMaxDiskGb()
        if (maxRamGb > machineMaxRam) {
            throw BadRequestException("La limite de RAM (${maxRamGb} Go) dépasse la RAM de la machine (${machineMaxRam} Go)")
        }
        if (maxDiskGb > machineMaxDisk) {
            throw BadRequestException("La limite de disque (${maxDiskGb} Go) dépasse le disque de la machine (${machineMaxDisk} Go)")
        }

        val limits = current()
        limits.maxRamGb = maxRamGb
        limits.maxDiskGb = maxDiskGb
        limits.updatedAt = LocalDateTime.now()
        repository.save(limits)
        writeJavaXmxToEnvFile(maxRamGb)
        log.info("Limites de ressources mises à jour: RAM=${maxRamGb}Go, Disque=${maxDiskGb}Go")
        return status()
    }

    /**
     * Upserts JAVA_XMX_GB in the .env file bind-mounted at HOMELAB_ENV_FILE_PATH, so the value
     * chosen here is what docker-compose's JAVA_TOOL_OPTIONS picks up on the next container
     * recreate - no more manual .env edit. Rounded down to a whole GB since -Xmx rejects decimals
     * (floor rather than round, so it never ends up above the machine cap already validated above).
     * No-op if HOMELAB_ENV_FILE_PATH isn't set (dev mode has no RAM cap/env file to mirror into) or
     * if the write fails - the DB value (and its "restart required" status) still applies either way.
     */
    private fun writeJavaXmxToEnvFile(maxRamGb: Double) {
        val envFilePath = env.getProperty("HOMELAB_ENV_FILE_PATH")
        if (envFilePath.isNullOrBlank()) return

        val path = Path.of(envFilePath)
        if (!Files.exists(path)) {
            log.warn("Fichier .env introuvable à $envFilePath, JAVA_XMX_GB non mis à jour")
            return
        }

        try {
            val xmxGb = max(1, floor(maxRamGb).toInt())
            val newLine = "JAVA_XMX_GB=$xmxGb"
            val lines = Files.readAllLines(path).toMutableList()
            val index = lines.indexOfFirst { it.startsWith("JAVA_XMX_GB=") }
            if (index >= 0) lines[index] = newLine else lines.add(newLine)
            Files.write(path, lines)
        } catch (e: IOException) {
            log.warn("Échec de l'écriture de JAVA_XMX_GB dans $envFilePath: ${e.message}")
        }
    }

    /** Throws if writing [additionalBytes] more would push total homelab disk usage past the configured cap. */
    fun checkDiskQuota(additionalBytes: Long) {
        val limits = current()
        val maxBytes = Formater.gigabytesToBytes(limits.maxDiskGb)
        val usedBytes = DiskUsage.current().totalBytes
        if (usedBytes + additionalBytes > maxBytes) {
            val usedGb = Formater.round(Formater.bytesToGigabytes(usedBytes), 2)
            log.warn("Quota disque dépassé: ${usedGb}Go utilisés / ${limits.maxDiskGb}Go, écriture refusée")
            throw BadRequestException(
                "Limite de stockage atteinte (${usedGb} / ${limits.maxDiskGb} Go) : opération refusée."
            )
        }
    }
}
