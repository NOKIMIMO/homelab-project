package com.homelab.core.model.auth

data class UpdatePasswordRequest(
    val currentPassword: String? = null,
    val newPassword: String = ""
)
