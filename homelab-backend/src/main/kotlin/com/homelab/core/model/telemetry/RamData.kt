package com.homelab.core.model.telemetry
data class RamData(
        val total: Double,
        val used: Double,
        val coreUsed: Double,
        val modulesUsed: Double
)
