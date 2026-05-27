package com.homelab.sdk.data

data class ColumnDefinition(
    val name: String,
    val type: String,
    val unique: Boolean = false,
    val nullable: Boolean = true,
    val regex: String? = null
) {
    override fun toString(): String {
        return "ColumnDefinition(name='$name', type='$type', unique=$unique, nullable=$nullable, regex=$regex)"
    }
}