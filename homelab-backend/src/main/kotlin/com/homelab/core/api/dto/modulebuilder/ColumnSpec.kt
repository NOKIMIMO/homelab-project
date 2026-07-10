package com.homelab.core.api.dto.modulebuilder

import com.homelab.sdk.data.ColumnTyping

data class ColumnSpec(
    val name: String,
    val type: ColumnTyping,
    val nullable: Boolean = true,
    val unique: Boolean = false,
    val regex: String? = null,
    // Only meaningful on an update request: the column's name before this edit, so a rename
    // can be applied in place (ALTER ... RENAME COLUMN) instead of read as "drop + add new".
    val previousName: String? = null
)
