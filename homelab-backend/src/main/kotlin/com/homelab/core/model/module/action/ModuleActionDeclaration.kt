package com.homelab.core.model.module.action

import com.fasterxml.jackson.annotation.JsonIgnoreProperties

@JsonIgnoreProperties(ignoreUnknown = true)
data class ModuleActionDeclaration(
    val name: String,
    val description: String,
    val parameters: List<ModuleActionParameter>,
    val logic: List<ModuleActionLogic>
)
