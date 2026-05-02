package com.homelab.core.model

data class TelemetryData(
        val cpu: Double,
        val ram: RamData,
        val disk: DiskData,
        val activeModulesCount: Int,
        val uptime: Long
)
