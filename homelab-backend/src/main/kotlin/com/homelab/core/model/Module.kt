package com.homelab.core.model

data class Module(
        val id: String,
        val name: String,
        val port: Int,
        val internalUrl: String,
        var status: ModuleStatus,
        val icon: String,
        val description: String? = null,
        var uptimeStart: Long? = null,
        val type: ModuleType = ModuleType.NODE
)
