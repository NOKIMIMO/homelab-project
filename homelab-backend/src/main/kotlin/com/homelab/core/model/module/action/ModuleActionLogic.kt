package com.homelab.core.model.module.action

import com.fasterxml.jackson.annotation.JsonIgnoreProperties

@JsonIgnoreProperties(ignoreUnknown = true)
data class ModuleActionLogic(
    val type: String,
    val parameters: Map<String, String>?
)
