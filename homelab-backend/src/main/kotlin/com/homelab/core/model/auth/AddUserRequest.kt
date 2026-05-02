package com.homelab.core.model.auth

data class AddUserRequest(
    val name: String? = null,
    val email: String,
    val publicKey: String? = null,
    val password: String? = null
)

