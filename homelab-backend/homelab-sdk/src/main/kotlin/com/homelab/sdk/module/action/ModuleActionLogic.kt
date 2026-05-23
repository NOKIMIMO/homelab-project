package com.homelab.sdk.module.action

data class ModuleActionLogic(
    val type: String,
    val params: Map<String, Any>? = null
)
