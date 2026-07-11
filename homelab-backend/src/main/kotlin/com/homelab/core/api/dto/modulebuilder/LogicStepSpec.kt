package com.homelab.core.api.dto.modulebuilder

data class LogicStepSpec(
    val actionType: String,
    val params: Map<String, String> = emptyMap()
)
