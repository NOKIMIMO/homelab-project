package com.homelab.core.api.dto.modulebuilder

data class AddColumnRequest(
    val tableName: String,
    val column: ColumnSpec
)
