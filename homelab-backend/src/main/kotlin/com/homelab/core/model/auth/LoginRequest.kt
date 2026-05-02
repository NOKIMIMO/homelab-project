package com.homelab.core.model.auth

data class LoginRequest(
    val email: String? = null,
    val password: String? = null,
    val challenge: String? = null,
    val signature: String? = null
)