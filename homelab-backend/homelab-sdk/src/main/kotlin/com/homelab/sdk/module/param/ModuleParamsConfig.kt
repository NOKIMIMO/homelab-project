package com.homelab.sdk.module.param

import com.fasterxml.jackson.annotation.JsonIgnoreProperties

@JsonIgnoreProperties(ignoreUnknown = true)
data class ModuleParamsConfig(
    val parameters: List<ModuleParamDeclaration> = emptyList()
)
