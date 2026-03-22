package com.homelab.core.model

data class TelemetryData(
        val cpu: Double,
        val ram: RamData,
        val disk: DiskData,
        val activeModulesCount: Int,
        val uptime: Long
)

data class RamData(
        val total: Double,
        val used: Double,
        val coreUsed: Double,
        val modulesUsed: Double
)

data class DiskData(
        val total: Double,
        val used: Double,
        val coreStorageUsed: Double,
        val modulesStorageUsed: Double
)
