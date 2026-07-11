package com.homelab.core.api.dto

import com.homelab.core.model.auth.PasswordResetRequest
import java.time.LocalDateTime

data class PasswordResetRequestDto(
    val id: Long?,
    val email: String,
    val status: String,
    val createdAt: LocalDateTime,
    val processedAt: LocalDateTime?,
)

fun PasswordResetRequest.toDto() = PasswordResetRequestDto(
    id = id,
    email = email,
    status = status,
    createdAt = createdAt,
    processedAt = processedAt,
)
