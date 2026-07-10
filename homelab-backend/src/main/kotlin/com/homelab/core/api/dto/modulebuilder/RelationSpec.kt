package com.homelab.core.api.dto.modulebuilder

import com.homelab.sdk.data.Cardinality

data class RelationSpec(
    val targetTable: String,
    val cardinality: Cardinality,
    val cascadeDelete: Boolean = false
)
