package com.homelab.sdk.data

data class RelationDefinition(
    val targetObject: String,
    val targetTable: String,
    val cardinality: Cardinality,
    val cascadeDelete: Boolean = false,
    val cascadeUpdate: Boolean = false
)
