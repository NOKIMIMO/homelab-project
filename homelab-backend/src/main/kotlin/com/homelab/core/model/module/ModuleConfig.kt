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
//    val router: String?, //if not present and page is len(1) then the first entry is the entrypoint
    val page: String?, // optional, a module can be API only,
    //TODO: Add permissions
    val permissions: List<String> = emptyList()
)
