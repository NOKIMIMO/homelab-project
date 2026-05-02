package com.homelab.core.model.module.action

import com.fasterxml.jackson.annotation.JsonIgnoreProperties

@JsonIgnoreProperties(ignoreUnknown = true)
data class ModuleActionParameter(
    val name: String,
    val description: String,
    val type: String
)
