package com.homelab.core.model.module

import com.fasterxml.jackson.annotation.JsonIgnoreProperties

@JsonIgnoreProperties(ignoreUnknown = true)
data class Dependency(
    val moduleId: String,
    val version: String
)