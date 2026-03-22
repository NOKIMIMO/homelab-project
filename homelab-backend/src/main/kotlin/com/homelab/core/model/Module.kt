package com.homelab.core.model

data class Module(
    val id: String,
    val name: String,
    val port: Int,
    val internalUrl: String,
    val status: String,
    val icon: String
)
