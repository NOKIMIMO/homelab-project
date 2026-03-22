package com.homelab.core.service

import com.homelab.core.model.DiskData
import com.homelab.core.model.RamData
import com.homelab.core.model.TelemetryData
import java.nio.file.Files
import java.nio.file.Path
import org.springframework.stereotype.Service
import oshi.SystemInfo

@Service
class TelemetryService(private val moduleService: ModuleService) {
        private val si = SystemInfo()
        private val os = si.operatingSystem
        private val hal = si.hardware

        fun getTelemetry(): TelemetryData {
                val processor = hal.processor
                val prevTicks = processor.systemCpuLoadTicks
                Thread.sleep(400)
                val cpuLoad = processor.getSystemCpuLoadBetweenTicks(prevTicks) * 100.0

                val memory = hal.memory
                val totalRamGb = memory.total.toDouble() / (1024 * 1024 * 1024)
                val availableRamGb = memory.available.toDouble() / (1024 * 1024 * 1024)
                val usedRamGb = totalRamGb - availableRamGb

                val pid = ProcessHandle.current().pid().toInt()
                val coreProcess = os.getProcess(pid)
                val coreRamGb =
                        (coreProcess?.residentSetSize ?: 0L).toDouble() / (1024 * 1024 * 1024)

                val moduleProcs =
                        os.processes.filter { proc ->
                                val cmd = proc.commandLine.lowercase()
                                val cwd = proc.currentWorkingDirectory.lowercase()
                                cwd.contains("photo-module") ||
                                        (cmd.contains("node") && cmd.contains("photo")) ||
                                        (cmd.contains("node") && cwd.contains("homelab_test"))
                        }
                val modulesRamGb =
                        moduleProcs.sumOf { it.residentSetSize }.toDouble() / (1024 * 1024 * 1024)

                val appRoot = Path.of("").toAbsolutePath().normalize()
                val modulesRoot =
                        appRoot.parent?.resolve("photo-module")?.normalize()
                                ?: appRoot.resolve("modules").normalize()

                val modulesSizeBytes = folderSizeBytes(modulesRoot)
                val coreSizeBytes = folderSizeBytes(appRoot, setOf(modulesRoot))

                val coreStorageGb = coreSizeBytes.toDouble() / (1024 * 1024 * 1024)
                val modulesStorageGb = modulesSizeBytes.toDouble() / (1024 * 1024 * 1024)

                val fileStore = Files.getFileStore(appRoot)
                val totalDiskGb = fileStore.totalSpace.toDouble() / (1024 * 1024 * 1024)
                val usedDiskGb =
                        (fileStore.totalSpace - fileStore.unallocatedSpace).toDouble() /
                                (1024 * 1024 * 1024)

                return TelemetryData(
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
                                moduleService.getModules().count { it.status == "ACTIVE" },
                        uptime = os.systemUptime
                )
        }

        private fun folderSizeBytes(root: Path, excludedRoots: Set<Path> = emptySet()): Long {
                if (!Files.exists(root)) return 0L
                return try {
                        Files.walk(root).use { stream ->
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
