package com.homelab.core.service

import com.homelab.core.model.auth.AdminPermission
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
