package com.homelab.core.model.module

import com.fasterxml.jackson.annotation.JsonIgnoreProperties
import com.homelab.core.model.module.action.ModuleAction

@JsonIgnoreProperties(ignoreUnknown = true)
data class ModuleConfig(
    val id: String,
    val name: String,
    val version: String,
    val icon: String,
    val description: String? = null,
    val actions: List<ModuleAction>,
    val dataObjects: List<String>?,
    val uIFormat: UIFormat = UIFormat.API, // default api only
    val page: String?, // optional, a module can be API only,
    val dependencies: List<Dependency>?,
    //TODO: Add permissions
    val permissions: List<String> = emptyList()
)
