package com.homelab.core.api.dto.modulebuilder

data class TableSpec(
    val name: String,
    val columns: List<ColumnSpec> = emptyList(),
    val enableFileStorage: Boolean = false,
    val relations: List<RelationSpec> = emptyList(),
    val uniqueTogether: List<List<String>> = emptyList(),
    val externalFetches: List<ExternalFetchSpec> = emptyList(),
    // Only meaningful on an update request: the table's name before this edit.
    val previousName: String? = null
)
