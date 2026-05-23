package com.homelab.sdk.module.action

data class ModuleActionParameter(
    val name: String,
    val description: String = "",
    val type: ModuleActionParameterType = ModuleActionParameterType.NONE
)