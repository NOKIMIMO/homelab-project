package com.homelab.core.api.dto

import com.homelab.core.model.auth.Role
import java.time.DayOfWeek
import java.time.LocalDateTime
import java.time.LocalTime

// A weekly slot during which the role's access is blocked. end < start crosses midnight.
data class BlockedWindowDto(
    val dayOfWeek: DayOfWeek,
    val start: LocalTime,
    val end: LocalTime,
)

// Create/update payload from the admin front.
data class RoleRequest(
    val name: String = "",
    val moduleIds: List<String> = emptyList(),
    val blockedWindows: List<BlockedWindowDto> = emptyList(),
)

data class RoleDto(
    val id: Long?,
    val name: String,
    val moduleIds: List<String>,
    val blockedWindows: List<BlockedWindowDto>,
    val createdAt: LocalDateTime,
    val updatedAt: LocalDateTime,
)

fun Role.toDto() = RoleDto(
    id = id,
    name = name,
    moduleIds = moduleIds.toList(),
    blockedWindows = blockedWindows.map { BlockedWindowDto(it.dayOfWeek, it.start, it.end) },
    createdAt = createdAt,
    updatedAt = updatedAt,
)
