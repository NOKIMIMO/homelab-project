package com.homelab.core.api.dto

import com.homelab.core.model.auth.SignupRequest
import java.time.LocalDateTime

data class SignupRequestDto(
    val id: Long?,
    val name: String?,
    val email: String,
    val publicKey: String?,
    val status: String,
    val createdAt: LocalDateTime,
    val processedAt: LocalDateTime?,
)

fun SignupRequest.toDto() = SignupRequestDto(
    id = id,
    name = name,
    email = email,
    publicKey = publicKey,
    status = status,
    createdAt = createdAt,
    processedAt = processedAt,
)
