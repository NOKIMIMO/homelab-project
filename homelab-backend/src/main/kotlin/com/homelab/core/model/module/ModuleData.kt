package com.homelab.core.model.module

data class ModuleData(
    val id: String,
    val type: String,
    val attributes: Map<String, String>,
    val children: List<ModuleData>
)