package com.homelab.core.api.dto.modulebuilder

data class ModuleSchemaResponse(
    val moduleId: String,
    val name: String,
    val description: String?,
    val tables: List<TableSpec>
)

data class ModuleBuilderSummary(
    val id: String,
    val name: String,
    val description: String?,
    val custom: Boolean
)
