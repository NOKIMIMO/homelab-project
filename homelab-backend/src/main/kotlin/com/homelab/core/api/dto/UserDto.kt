package com.homelab.core.api.dto

import com.homelab.core.model.auth.User
import com.homelab.core.model.auth.effectiveAdminPermissions
import java.time.LocalDateTime

data class UserDto(
    val id: Long?,
    val email: String,
    val name: String?,
    val isAdmin: Boolean,
    val publicKey: String?,
    val permissions: Set<String>,
    val roleIds: List<Long>,
    // Effective AdminPermission.name() values (union of the user's roles' grants, or every
    // permission if isAdmin). Lets the frontend gate admin-panel sections without decoding a
    // possibly-stale JWT claim.
    val adminPermissions: Set<String>,
    val mustResetPassword: Boolean,
    val createdAt: LocalDateTime,
)

fun User.toDto() = UserDto(
    id = id,
    email = email,
    name = name,
    isAdmin = isAdmin,
    publicKey = publicKey,
    permissions = permissions,
    roleIds = roles.mapNotNull { it.id },
    adminPermissions = effectiveAdminPermissions(),
    mustResetPassword = mustResetPassword,
    createdAt = createdAt,
)
