package com.homelab.core.model

import com.fasterxml.jackson.annotation.JsonIgnoreProperties

@JsonIgnoreProperties(ignoreUnknown = true)
data class ModuleConfig(
    val id: String,
    val name: String,
    val port: Int,
    val icon: String,
    val description: String? = null,
    val databaseName: String? = null,
    val installCommand: String? = null,
    val developmentCommand: String? = null, //dev only command
    val startCommand: String? = null,
    val type: ModuleType = ModuleType.NODE
)
