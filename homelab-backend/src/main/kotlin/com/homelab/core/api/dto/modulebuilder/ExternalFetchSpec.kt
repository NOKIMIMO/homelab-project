package com.homelab.core.api.dto.modulebuilder

data class ExternalFetchSpec(
    val functionName: String,
    val description: String = "",
    val urlTemplate: String,
    val method: String = "GET",
    val queryParams: List<String> = emptyList(),
    val responseMapping: Map<String, String> = emptyMap(),
    val upsertKey: String? = null
)
