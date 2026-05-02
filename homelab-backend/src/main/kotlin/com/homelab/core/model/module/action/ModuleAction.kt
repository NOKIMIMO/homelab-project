package com.homelab.core.model.module.action

import com.fasterxml.jackson.annotation.JsonIgnoreProperties

@JsonIgnoreProperties(ignoreUnknown = true)
data class ModuleAction(
    val visual : String, // path
    val functions: List<ModuleActionDeclaration>
)
