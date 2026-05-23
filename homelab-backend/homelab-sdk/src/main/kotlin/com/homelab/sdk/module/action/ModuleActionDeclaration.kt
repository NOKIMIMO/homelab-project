package com.homelab.sdk.module.action

import com.fasterxml.jackson.annotation.JsonIgnoreProperties

@JsonIgnoreProperties(ignoreUnknown = true)
data class ModuleActionDeclaration(
    val name: String,
    val description: String,
    val parameters: List<ModuleActionParameter>, // Like *args
    val logic: List<ModuleActionLogic>,
    val actUponObject: String
)




