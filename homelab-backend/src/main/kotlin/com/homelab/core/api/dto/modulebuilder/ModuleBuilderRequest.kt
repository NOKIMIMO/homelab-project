package com.homelab.core.api.dto.modulebuilder

data class ModuleBuilderRequest(
    val id: String,
    val name: String,
    val description: String? = null,
    val tables: List<TableSpec> = emptyList(),
    val params: List<ModuleParamSpec> = emptyList()
)
