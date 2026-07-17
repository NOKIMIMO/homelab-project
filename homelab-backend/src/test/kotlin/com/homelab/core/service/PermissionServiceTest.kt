package com.homelab.core.service

import com.homelab.core.model.auth.AdminPermission
import com.homelab.core.model.auth.BlockedWindow
import com.homelab.core.model.auth.Role
import com.homelab.core.model.auth.User
import com.homelab.core.model.auth.UserRepository
import com.homelab.core.model.module.ModuleConfig
import com.homelab.core.model.module.UIFormat
import com.homelab.sdk.module.action.ModuleActionDeclaration
import com.homelab.sdk.module.action.ModuleActionLogic
import org.junit.jupiter.api.Assertions.assertEquals
import org.junit.jupiter.api.Assertions.assertFalse
import org.junit.jupiter.api.Assertions.assertTrue
import org.junit.jupiter.api.Test
import org.mockito.Mockito.mock
import java.time.LocalDateTime
import java.time.LocalTime

class PermissionServiceTest {

    private val userRepository = mock(UserRepository::class.java)
    private val service = PermissionService(userRepository)

    private fun module(id: String = "photos", permissions: List<String> = emptyList()) = ModuleConfig(
        id = id,
        name = id,
        version = "1.0",
        icon = "icon.svg",
        actions = emptyList(),
        dataObjects = emptyList(),
        uIFormat = UIFormat.API,
        page = null,
        dependencies = emptyList(),
        permissions = permissions
    )

    private fun declaration(logicTypes: List<String>) = ModuleActionDeclaration(
        name = "action",
        description = "",
        parameters = emptyList(),
        logic = logicTypes.map { ModuleActionLogic(type = it) },
        actUponObject = "items"
    )

    @Test
    fun `requiredPermissions is empty when the module declares no permissions`() {
        val required = service.requiredPermissions(module(permissions = emptyList()), declaration(listOf("DELETE")))

        assertTrue(required.isEmpty())
    }

    @Test
    fun `requiredPermissions maps action verbs to declared module-scoped permissions`() {
        val mod = module(id = "photos", permissions = listOf("write:photos", "delete:photos"))

        val required = service.requiredPermissions(mod, declaration(listOf("CREATE", "DELETE", "READ")))

        assertEquals(setOf("write:photos", "delete:photos"), required)
    }

    @Test
    fun `requiredPermissions ignores verbs the module did not declare`() {
        val mod = module(id = "photos", permissions = listOf("write:photos"))

        val required = service.requiredPermissions(mod, declaration(listOf("DELETE")))

        assertTrue(required.isEmpty())
    }

    @Test
    fun `canInvoke always allows a full admin`() {
        val admin = User(email = "admin@example.com", isAdmin = true)

        assertTrue(service.canInvoke(admin, module(permissions = listOf("write:photos")), declaration(listOf("CREATE"))))
    }

    @Test
    fun `canInvoke allows anyone when the module requires no permissions`() {
        val user = User(email = "user@example.com", isAdmin = false)

        assertTrue(service.canInvoke(user, module(permissions = emptyList()), declaration(listOf("DELETE"))))
    }

    @Test
    fun `canInvoke allows a user whose role grants the module and is not currently blocked`() {
        val role = Role(name = "family", moduleIds = mutableSetOf("photos"))
        val user = User(email = "user@example.com", isAdmin = false, roles = mutableSetOf(role))

        assertTrue(service.canInvoke(user, module(id = "photos", permissions = listOf("write:photos")), declaration(listOf("CREATE"))))
    }

    @Test
    fun `canInvoke falls back to explicit user permissions when no role grants the module`() {
        val user = User(email = "user@example.com", isAdmin = false, permissions = mutableSetOf("write:photos"))

        assertTrue(service.canInvoke(user, module(id = "photos", permissions = listOf("write:photos")), declaration(listOf("CREATE"))))
    }

    @Test
    fun `canInvoke denies a user with neither a granting role nor the explicit permission`() {
        val user = User(email = "user@example.com", isAdmin = false)

        assertFalse(service.canInvoke(user, module(id = "photos", permissions = listOf("write:photos")), declaration(listOf("CREATE"))))
    }

    // A blocked window covering the whole current day of week, so the role is blocked "now".
    private fun allDayBlock() = BlockedWindow(
        dayOfWeek = LocalDateTime.now().dayOfWeek,
        start = LocalTime.MIDNIGHT,
        end = LocalTime.MAX
    )

    @Test
    fun `canAccessModule always allows a full admin`() {
        val admin = User(email = "admin@example.com", isAdmin = true)

        assertTrue(service.canAccessModule(admin, module(permissions = listOf("write:photos"))))
    }

    @Test
    fun `canAccessModule allows anyone when the module declares no permissions`() {
        val user = User(email = "user@example.com", isAdmin = false)

        assertTrue(service.canAccessModule(user, module(permissions = emptyList())))
    }

    @Test
    fun `canAccessModule allows a user whose role grants the module and is not blocked`() {
        val role = Role(name = "family", moduleIds = mutableSetOf("photos"))
        val user = User(email = "user@example.com", isAdmin = false, roles = mutableSetOf(role))

        assertTrue(service.canAccessModule(user, module(id = "photos", permissions = listOf("write:photos"))))
    }

    @Test
    fun `canAccessModule hides the module while the granting role is inside a blocked time window`() {
        val role = Role(name = "family", moduleIds = mutableSetOf("photos"), blockedWindows = mutableListOf(allDayBlock()))
        val user = User(email = "user@example.com", isAdmin = false, roles = mutableSetOf(role))

        assertFalse(service.canAccessModule(user, module(id = "photos", permissions = listOf("write:photos"))))
    }

    @Test
    fun `canAccessModule still shows the module during a block when a direct permission grants it`() {
        val role = Role(name = "family", moduleIds = mutableSetOf("photos"), blockedWindows = mutableListOf(allDayBlock()))
        val user = User(
            email = "user@example.com",
            isAdmin = false,
            roles = mutableSetOf(role),
            permissions = mutableSetOf("read:photos")
        )

        assertTrue(service.canAccessModule(user, module(id = "photos", permissions = listOf("write:photos", "read:photos"))))
    }

    @Test
    fun `canAccessModule hides a module the user has neither a granting role nor a direct permission for`() {
        val user = User(email = "user@example.com", isAdmin = false)

        assertFalse(service.canAccessModule(user, module(id = "photos", permissions = listOf("write:photos"))))
    }

    @Test
    fun `hasAdminPermission is true for a full admin`() {
        val admin = User(email = "admin@example.com", isAdmin = true)

        assertTrue(service.hasAdminPermission(admin, AdminPermission.ADMIN_ACCESS))
    }

    @Test
    fun `hasAdminPermission reflects role-granted admin permissions for a non-admin`() {
        val granting = Role(name = "moderator", adminPermissions = mutableSetOf("ADMIN_ACCESS"))
        val plainUser = User(email = "plain@example.com", isAdmin = false)
        val elevated = User(email = "user@example.com", isAdmin = false, roles = mutableSetOf(granting))

        assertTrue(service.hasAdminPermission(elevated, AdminPermission.ADMIN_ACCESS))
        assertFalse(service.hasAdminPermission(plainUser, AdminPermission.ADMIN_ACCESS))
    }
}
