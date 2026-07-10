package com.homelab.core.model.auth

data class RecoveryResetRequest(
    val code: String,
    val name: String? = null,
    val email: String,
    val password: String? = null,
    val publicKey: String? = null
)
