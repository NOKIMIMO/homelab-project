package com.homelab.core.model.auth

import org.junit.jupiter.api.Assertions.assertFalse
import org.junit.jupiter.api.Assertions.assertTrue
import org.junit.jupiter.api.Test
import java.time.DayOfWeek
import java.time.LocalDateTime
import java.time.LocalTime

class RoleTest {

    private fun roleWithWindow(day: DayOfWeek, start: LocalTime, end: LocalTime) = Role().apply {
        blockedWindows = mutableListOf(BlockedWindow(day, start, end))
    }

    @Test
    fun `isBlockedAt is false when the role has no blocked windows`() {
        val role = Role()
        assertFalse(role.isBlockedAt(LocalDateTime.of(2026, 7, 16, 10, 0)))
    }

    @Test
    fun `isBlockedAt is true within a same-day window`() {
        val role = roleWithWindow(DayOfWeek.THURSDAY, LocalTime.of(9, 0), LocalTime.of(17, 0))
        // 2026-07-16 is a Thursday
        assertTrue(role.isBlockedAt(LocalDateTime.of(2026, 7, 16, 12, 0)))
    }

    @Test
    fun `isBlockedAt is false outside a same-day window`() {
        val role = roleWithWindow(DayOfWeek.THURSDAY, LocalTime.of(9, 0), LocalTime.of(17, 0))
        assertFalse(role.isBlockedAt(LocalDateTime.of(2026, 7, 16, 18, 0)))
    }

    @Test
    fun `isBlockedAt end is exclusive for a same-day window`() {
        val role = roleWithWindow(DayOfWeek.THURSDAY, LocalTime.of(9, 0), LocalTime.of(17, 0))
        assertFalse(role.isBlockedAt(LocalDateTime.of(2026, 7, 16, 17, 0)))
    }

    @Test
    fun `isBlockedAt is true in the evening part of an overnight window`() {
        val role = roleWithWindow(DayOfWeek.THURSDAY, LocalTime.of(20, 0), LocalTime.of(7, 0))
        assertTrue(role.isBlockedAt(LocalDateTime.of(2026, 7, 16, 22, 0)))
    }

    @Test
    fun `isBlockedAt is true the next morning for an overnight window started the day before`() {
        val role = roleWithWindow(DayOfWeek.THURSDAY, LocalTime.of(20, 0), LocalTime.of(7, 0))
        // Friday 2026-07-17 at 06:00 is still within Thursday's overnight window
        assertTrue(role.isBlockedAt(LocalDateTime.of(2026, 7, 17, 6, 0)))
    }

    @Test
    fun `isBlockedAt is false the next morning once the overnight window has ended`() {
        val role = roleWithWindow(DayOfWeek.THURSDAY, LocalTime.of(20, 0), LocalTime.of(7, 0))
        assertFalse(role.isBlockedAt(LocalDateTime.of(2026, 7, 17, 8, 0)))
    }

    @Test
    fun `isBlockedAt only applies the window to its declared day of week`() {
        val role = roleWithWindow(DayOfWeek.MONDAY, LocalTime.of(9, 0), LocalTime.of(17, 0))
        assertFalse(role.isBlockedAt(LocalDateTime.of(2026, 7, 16, 12, 0)))
    }
}
