package com.homelab.sdk.filter

data class FilterSpec(
    val column: String,
    val operator: FilterOperator,
    val value: Any?
)

