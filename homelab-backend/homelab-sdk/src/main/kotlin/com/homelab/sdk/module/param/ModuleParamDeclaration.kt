package com.homelab.sdk.module.param

import com.fasterxml.jackson.annotation.JsonIgnoreProperties

@JsonIgnoreProperties(ignoreUnknown = true)
data class ModuleParamDeclaration(
    val key: String,
    val label: String,
    val type: String = "string",
    val defaultValue: String = "",
    val description: String = ""
)
