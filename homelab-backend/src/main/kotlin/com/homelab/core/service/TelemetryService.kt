package com.homelab.core.service

import com.homelab.core.helper.Formater
import com.homelab.core.model.DiskData
import com.homelab.core.model.ModuleStatus
import com.homelab.core.model.RamData
import com.homelab.core.model.TelemetryData
import com.homelab.core.service.module.ModuleService
import jakarta.annotation.PostConstruct
import java.nio.file.Files
import java.nio.file.Path
import java.util.concurrent.atomic.AtomicReference
import org.springframework.scheduling.annotation.Scheduled
import org.springframework.stereotype.Service
import oshi.SystemInfo

@Service
class TelemetryService(private val moduleService: ModuleService) {
        private val si = SystemInfo()
        private val os = si.operatingSystem
        private val hal = si.hardware
        private val cachedTelemetry = AtomicReference<TelemetryData>()

        @PostConstruct
        fun init() {
                updateTelemetry()
        }

        fun getTelemetry(): TelemetryData? = cachedTelemetry.get()

        @Scheduled(fixedRate = 10000)
        fun updateTelemetry() {
                try {
                        val processor = hal.processor

                        val cpuLoad = processor.getSystemCpuLoad(500) * 100.0

                        val memory = hal.memory
                        val totalRamGb = Formater.bytesToGigabytes(memory.total)
                        val usedRamGb = Formater.bytesToGigabytes(memory.total - memory.available)

                        val pid = ProcessHandle.current().pid().toInt()
                        val coreProcess = os.getProcess(pid)
                        val coreRamGb = Formater.bytesToGigabytes(coreProcess?.residentSetSize ?: 0L)

                        val modulesRamGb = 0.0

                        val appRoot = Path.of("").toAbsolutePath().normalize()
                        val modulesRoot = Path.of("/modules").toAbsolutePath().normalize()

                        val modulesSizeBytes =
                                if (Files.exists(modulesRoot)) folderSizeBytes(modulesRoot) else 0L
                        val coreSizeBytes =
                                folderSizeBytes(
                                        appRoot,
                                        if (Files.exists(modulesRoot)) setOf(modulesRoot)
                                        else emptySet()
                                )

                        val coreStorageGb = Formater.bytesToGigabytes(coreSizeBytes)
                        val modulesStorageGb = Formater.bytesToGigabytes(modulesSizeBytes)

                        val fileStore = Files.getFileStore(appRoot)
                        val totalDiskGb = Formater.bytesToGigabytes(fileStore.totalSpace)
                        val usedDiskGb =
                                Formater.bytesToGigabytes(
                                        fileStore.totalSpace - fileStore.unallocatedSpace
                                )

                        val data =
                                TelemetryData(
                                        cpu = Formater.round(cpuLoad, 1),
                                        ram =
                                                RamData(
                                                        total = Formater.round(totalRamGb, 1),
                                                        used = Formater.round(usedRamGb, 1),
                                                        coreUsed = Formater.round(coreRamGb, 3),
                                                        modulesUsed = Formater.round(modulesRamGb, 3)
                                                ),
                                        disk =
                                                DiskData(
                                                        total = Formater.round(totalDiskGb, 1),
                                                        used = Formater.round(usedDiskGb, 1),
                                                        coreStorageUsed = Formater.round(coreStorageGb, 5),
                                                        modulesStorageUsed =
                                                                Formater.round(modulesStorageGb, 5)
                                                ),
                                        activeModulesCount =
                                                moduleService.getModules().count {
                                                        it.status == ModuleStatus.ACTIVE
                                                },
                                        uptime = os.systemUptime
                                )
                        cachedTelemetry.set(data)
                } catch (e: Exception) {
                        println("Telemetry update failed: ${e.message}")
                }
        }



        private fun folderSizeBytes(root: Path, excludedRoots: Set<Path> = emptySet()): Long {
                if (!Files.exists(root)) return 0L
                return try {
                        Files.walk(root, 2).use { stream -> // Limit depth to avoid infinite scan
                                stream
                                        .filter { path ->
                                                excludedRoots.none { excluded ->
                                                        path.startsWith(excluded)
                                                }
                                        }
                                        .filter { Files.isRegularFile(it) }
                                        .mapToLong { Files.size(it) }
                                        .sum()
                        }
                } catch (e: Exception) {
                        0L
                }
        }
}
