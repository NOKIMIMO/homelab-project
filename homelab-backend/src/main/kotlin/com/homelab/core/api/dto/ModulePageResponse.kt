package com.homelab.core.api.dto

data class ModulePageResponse(
    val type: String,
    val content: Any? // actually String or JsonNode
)