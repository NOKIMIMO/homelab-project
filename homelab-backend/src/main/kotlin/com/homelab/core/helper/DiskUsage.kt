package com.homelab.core.helper

import com.homelab.sdk.helper.AppLogger
import java.nio.file.Files
import java.nio.file.Path

// Real, on-disk usage of the homelab (core app + modules). Shared by TelemetryService (display)
// and ResourceLimitsService (quota enforcement) so the displayed and enforced numbers never
// drift apart.
object DiskUsage {
    private val log = AppLogger.loggerFor(DiskUsage::class)

    data class Usage(val coreBytes: Long, val modulesBytes: Long) {
        val totalBytes: Long get() = coreBytes + modulesBytes
    }

    private val appRoot: Path = Path.of("").toAbsolutePath().normalize()
    private val modulesRoot: Path = Path.of("/modules").toAbsolutePath().normalize()

    fun folderSizeBytes(root: Path, excludedRoots: Set<Path> = emptySet()): Long {
        if (!Files.exists(root)) return 0L
        return try {
            Files.walk(root, 2).use { stream -> // Limit depth to avoid infinite scan
                stream
                    .filter { path -> excludedRoots.none { excluded -> path.startsWith(excluded) } }
                    .filter { Files.isRegularFile(it) }
                    .mapToLong { Files.size(it) }
                    .sum()
            }
        } catch (e: Exception) {
            log.error("Failed to calculate folder size for $root: ${e.message}", e)
            0L
        }
    }

    fun current(): Usage {
        val modulesBytes = if (Files.exists(modulesRoot)) folderSizeBytes(modulesRoot) else 0L
        val coreBytes = folderSizeBytes(
            appRoot,
            if (Files.exists(modulesRoot)) setOf(modulesRoot) else emptySet()
        )
        return Usage(coreBytes, modulesBytes)
    }
}
