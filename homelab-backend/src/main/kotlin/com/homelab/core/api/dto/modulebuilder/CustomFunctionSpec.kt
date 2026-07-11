package com.homelab.core.api.dto.modulebuilder

import com.homelab.sdk.module.action.ModuleActionParameterType

data class CustomFunctionParamSpec(
    val name: String,
    val type: ModuleActionParameterType = ModuleActionParameterType.NONE,
    val description: String = "",
    val optional: Boolean = true
)

data class CustomFunctionSpec(
    val name: String,
    val description: String = "",
    val parameters: List<CustomFunctionParamSpec> = emptyList(),
    val logic: List<LogicStepSpec> = emptyList()
)
