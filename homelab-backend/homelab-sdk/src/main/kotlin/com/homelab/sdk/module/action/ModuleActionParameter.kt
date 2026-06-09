package com.homelab.sdk.module.action

data class ModuleActionParameter(
    val name: String,
    val description: String = "",
    val type: ModuleActionParameterType = ModuleActionParameterType.NONE, // identitifer and comparison usage
    // if type is NONE then it's a parameter, if not it's used for comparison and identification of the function to execute
    val relation: String? = null, // format : "moduleId.actUponObjectName" same as schema in DB
    val optional: Boolean = true
)