package com.homelab.core.service

import com.homelab.core.model.DiskData
import com.homelab.core.model.ModuleStatus
import com.homelab.core.model.RamData
import com.homelab.core.model.TelemetryData
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
                        val totalRamGb = memory.total.toDouble() / (1024 * 1024 * 1024)
                        val availableRamGb = memory.available.toDouble() / (1024 * 1024 * 1024)
                        val usedRamGb = totalRamGb - availableRamGb

                        val pid = ProcessHandle.current().pid().toInt()
                        val coreProcess = os.getProcess(pid)
                        val coreRamGb =
                                (coreProcess?.residentSetSize ?: 0L).toDouble() /
                                        (1024 * 1024 * 1024)

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

                        val coreStorageGb = coreSizeBytes.toDouble() / (1024 * 1024 * 1024)
                        val modulesStorageGb = modulesSizeBytes.toDouble() / (1024 * 1024 * 1024)

                        val fileStore = Files.getFileStore(appRoot)
                        val totalDiskGb = fileStore.totalSpace.toDouble() / (1024 * 1024 * 1024)
                        val usedDiskGb =
                                (fileStore.totalSpace - fileStore.unallocatedSpace).toDouble() /
                                        (1024 * 1024 * 1024)

                        val data =
                                TelemetryData(
                                        cpu = "%.1f".format(cpuLoad).replace(',', '.').toDouble(),
                                        ram =
                                                RamData(
                                                        total =
                                                                "%.1f".format(totalRamGb)
                                                                        .replace(',', '.')
                                                                        .toDouble(),
                                                        used =
                                                                "%.1f".format(usedRamGb)
                                                                        .replace(',', '.')
                                                                        .toDouble(),
                                                        coreUsed =
                                                                "%.3f".format(coreRamGb)
                                                                        .replace(',', '.')
                                                                        .toDouble(),
                                                        modulesUsed =
                                                                "%.3f".format(modulesRamGb)
                                                                        .replace(',', '.')
                                                                        .toDouble()
                                                ),
                                        disk =
                                                DiskData(
                                                        total =
                                                                "%.1f".format(totalDiskGb)
                                                                        .replace(',', '.')
                                                                        .toDouble(),
                                                        used =
                                                                "%.1f".format(usedDiskGb)
                                                                        .replace(',', '.')
                                                                        .toDouble(),
                                                        coreStorageUsed =
                                                                "%.5f".format(coreStorageGb)
                                                                        .replace(',', '.')
                                                                        .toDouble(),
                                                        modulesStorageUsed =
                                                                "%.5f".format(modulesStorageGb)
                                                                        .replace(',', '.')
                                                                        .toDouble()
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
