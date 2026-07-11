package com.homelab.core.api.dto.modulebuilder

data class DependencySpec(
    val moduleId: String,
    val version: String = ""
)
