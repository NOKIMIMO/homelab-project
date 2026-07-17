package com.homelab.core.model.auth

import org.junit.jupiter.api.Assertions.assertEquals
import org.junit.jupiter.api.Assertions.assertNull
import org.junit.jupiter.api.Test

class AdminPermissionTest {

    @Test
    fun `fromNameOrNull resolves a known permission name`() {
        assertEquals(AdminPermission.ADMIN_ACCESS, AdminPermission.fromNameOrNull("ADMIN_ACCESS"))
    }

    @Test
    fun `fromNameOrNull returns null for an unknown name`() {
        assertNull(AdminPermission.fromNameOrNull("NOT_A_PERMISSION"))
    }

    @Test
    fun `effectiveAdminPermissions grants every permission to a full admin`() {
        val admin = User(email = "admin@example.com", isAdmin = true)

        val effective = admin.effectiveAdminPermissions()

        assertEquals(AdminPermission.entries.map { it.name }.toSet(), effective)
    }

    @Test
    fun `effectiveAdminPermissions unions permissions from all roles for a non-admin`() {
        val granting = Role(name = "roleA", adminPermissions = mutableSetOf("ADMIN_ACCESS"))
        val plain = Role(name = "roleB", moduleIds = mutableSetOf("photos"))
        val user = User(email = "user@example.com", isAdmin = false, roles = mutableSetOf(granting, plain))

        assertEquals(setOf("ADMIN_ACCESS"), user.effectiveAdminPermissions())
    }

    @Test
    fun `effectiveAdminPermissions is empty for a non-admin with no roles`() {
        val user = User(email = "user@example.com", isAdmin = false)

        assertEquals(emptySet<String>(), user.effectiveAdminPermissions())
    }
}
