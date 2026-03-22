package com.homelab.core.model

data class ModuleConfig(
    val id: String,
    val name: String,
    val port: Int,
    val icon: String,
    val description: String? = null,
    val installCommand: String? = null,
    val startCommand: String? = null,
    val type: ModuleType = ModuleType.NODE
)
