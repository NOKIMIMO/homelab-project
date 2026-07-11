package com.homelab.core.api.dto

import com.homelab.core.model.auth.User
import java.time.LocalDateTime

data class UserDto(
    val id: Long?,
    val email: String,
    val name: String?,
    val isAdmin: Boolean,
    val publicKey: String?,
    val mustResetPassword: Boolean,
    val createdAt: LocalDateTime,
)

fun User.toDto() = UserDto(
    id = id,
    email = email,
    name = name,
    isAdmin = isAdmin,
    publicKey = publicKey,
    mustResetPassword = mustResetPassword,
    createdAt = createdAt,
)
