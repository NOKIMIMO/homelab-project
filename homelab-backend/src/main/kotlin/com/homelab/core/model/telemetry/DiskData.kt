package com.homelab.core.model.telemetry

data class DiskData(
        val total: Double,
        val used: Double,
        val coreStorageUsed: Double,
        val modulesStorageUsed: Double
)