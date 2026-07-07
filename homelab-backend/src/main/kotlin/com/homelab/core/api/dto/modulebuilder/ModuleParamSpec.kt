package com.homelab.core.api.dto.modulebuilder

data class ModuleParamSpec(
    val key: String,
    val label: String,
    val type: String = "string",
    val defaultValue: String = "",
    val description: String = ""
)
