package com.homelab.core.service

import com.homelab.core.config.ModuleConfigMemory
import com.homelab.core.controller.AppletControler
import com.homelab.core.helper.DiskUsage
import com.homelab.sdk.helper.AppLogger
import com.homelab.sdk.helper.Formater
import com.homelab.core.model.telemetry.CpuData
import com.homelab.core.model.telemetry.DiskData
import com.homelab.core.model.module.ModuleStatus
import com.homelab.core.model.telemetry.ModuleStorageData
import com.homelab.core.model.telemetry.RamData
import com.homelab.core.model.telemetry.TelemetryData
import com.homelab.core.service.module.ModuleService
import jakarta.annotation.PostConstruct
import java.lang.management.ManagementFactory
import java.nio.file.Files
import java.nio.file.Path
import java.util.concurrent.atomic.AtomicReference
import org.springframework.scheduling.annotation.Scheduled
import org.springframework.stereotype.Service
import oshi.SystemInfo

@Service
class TelemetryService(
        private val moduleService: ModuleService,
        private val moduleConfigMemory: ModuleConfigMemory
) {

        private val log = AppLogger.loggerFor(TelemetryService::class)

        private val si = SystemInfo()
        private val os = si.operatingSystem
        private val hal = si.hardware
        private val cachedTelemetry = AtomicReference<TelemetryData>()

        // OSHI recommends sampling CPU ticks over "at least a few seconds" - a short blocking
        // window (e.g. 500ms) is too coarse for a lightly loaded process and rounds to 0%. Since
        // this runs on a 10s @Scheduled cycle anyway, we keep the previous cycle's tick snapshot
        // and diff against it instead of blocking, giving a full ~10s sampling window for free.
        private var priorSystemTicks: LongArray? = null
        private var priorCoreProcess: oshi.software.os.OSProcess? = null

        @PostConstruct
        fun init() {
                priorSystemTicks = hal.processor.systemCpuLoadTicks
                priorCoreProcess = os.getProcess(ProcessHandle.current().pid().toInt())
                updateTelemetry()
        }

        fun getTelemetry(): TelemetryData? = cachedTelemetry.get()

        @Scheduled(fixedRate = 10000)
        fun updateTelemetry() {
                try {
                        val processor = hal.processor

                        val pid = ProcessHandle.current().pid().toInt()
                        val coreProcess = os.getProcess(pid)

                        val cpuLoad =
                                priorSystemTicks?.let { processor.getSystemCpuLoadBetweenTicks(it) * 100.0 }
                                        ?: 0.0
                        val coreCpuLoad =
                                if (priorCoreProcess != null && coreProcess != null) {
                                        coreProcess.getProcessCpuLoadBetweenTicks(priorCoreProcess) *
                                                100.0
                                } else 0.0

                        priorSystemTicks = processor.systemCpuLoadTicks
                        priorCoreProcess = coreProcess

                        val memory = hal.memory
                        val totalRamGb = Formater.bytesToGigabytes(memory.total)
                        val usedRamGb = Formater.bytesToGigabytes(memory.total - memory.available)

                        val coreRamGb = Formater.bytesToGigabytes(coreProcess?.residentSetSize ?: 0L)

                        val modulesRamGb = 0.0

                        val diskUsage = DiskUsage.current()
                        val coreStorageGb = Formater.bytesToGigabytes(diskUsage.coreBytes)
                        val modulesStorageGb = Formater.bytesToGigabytes(diskUsage.modulesBytes)

                        val perModuleStorage =
                                moduleService.getModules().map { module ->
                                        val moduleDir = moduleConfigMemory.getDirectory(module.id)
                                        val sizeBytes =
                                                moduleDir?.toPath()?.let {
                                                        DiskUsage.folderSizeBytes(it)
                                                } ?: 0L
                                        ModuleStorageData(
                                                id = module.id,
                                                name = module.name,
                                                storageGb =
                                                        Formater.round(
                                                                Formater.bytesToGigabytes(sizeBytes),
                                                                5
                                                        )
                                        )
                                }

                        val fileStore = Files.getFileStore(Path.of("").toAbsolutePath().normalize())
                        val totalDiskGb = Formater.bytesToGigabytes(fileStore.totalSpace)
                        val usedDiskGb =
                                Formater.bytesToGigabytes(
                                        fileStore.totalSpace - fileStore.unallocatedSpace
                                )

                        val data =
                                TelemetryData(
                                        cpu =
                                                CpuData(
                                                        total = Formater.round(cpuLoad, 1),
                                                        coreUsed =
                                                                Formater.round(coreCpuLoad, 1)
                                                ),
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
                                        // JVM process uptime rather than os.systemUptime: under Docker Desktop on
                                        // Windows/Mac, /proc/uptime reflects the WSL2/VM kernel's boot time, not
                                        // the real host uptime, so it drifted from what users actually see.
                                        uptime = ManagementFactory.getRuntimeMXBean().uptime / 1000,
                                        perModuleStorage = perModuleStorage
                                )
                        cachedTelemetry.set(data)
                } catch (e: Exception) {
                        log.error("Failed to update telemetry: ${e.message}", e)
                }
        }

}
