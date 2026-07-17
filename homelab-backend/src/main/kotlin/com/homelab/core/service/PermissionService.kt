package com.homelab.core.service

import com.homelab.core.model.auth.AdminPermission
import com.homelab.core.model.auth.User
import com.homelab.core.model.auth.UserRepository
import com.homelab.core.model.auth.effectiveAdminPermissions
import com.homelab.core.model.module.ModuleConfig
import com.homelab.sdk.module.action.ModuleActionDeclaration
import java.time.LocalDateTime
import org.springframework.security.core.context.SecurityContextHolder
import org.springframework.stereotype.Service

@Service
class PermissionService(private val userRepository: UserRepository) {

    private val writeTypes = setOf("CREATE", "UPDATE", "PUT", "UPLOAD_FILE")
    private val deleteTypes = setOf("DELETE")
    private val readTypes = setOf("READ", "LIST", "GET_FILE", "FETCH_EXTERNAL", "FETCH_EXTERNAL_GENERIC")

    private fun verbFor(actionType: String): String? = when (actionType) {
        in writeTypes -> "write"
        in deleteTypes -> "delete"
        in readTypes -> "read"
        else -> null
    }

    /**
     * Only permissions the module itself declares are enforced - undeclared verbs stay open,
     * matching today's behavior for modules that don't declare any permissions at all.
     */
    fun requiredPermissions(module: ModuleConfig, decl: ModuleActionDeclaration): Set<String> {
        val declared = module.permissions.toSet()
        if (declared.isEmpty()) return emptySet()
        return decl.logic
            .mapNotNull { verbFor(it.type) }
            .map { "$it:${module.id}" }
            .filter { it in declared }
            .toSet()
    }

    fun canInvoke(user: User, module: ModuleConfig, decl: ModuleActionDeclaration): Boolean {
        if (user.isAdmin) return true
        val required = requiredPermissions(module, decl)
        if (required.isEmpty()) return true
        // A role granting this module opens all of its actions, unless the role is currently within
        // one of its blocked time windows. Direct per-user permissions still apply as a fallback.
        val now = LocalDateTime.now()
        if (user.roles.any { module.id in it.moduleIds && !it.isBlockedAt(now) }) return true
        return user.permissions.containsAll(required)
    }

    /**
     * Whether [user] should currently see/reach [module] at all. Mirrors [canInvoke]'s access model
     * at the module level so a module a user cannot use never shows up for them: a full admin and a
     * module that declares no permissions are always visible; otherwise a role granting the module
     * makes it visible unless that role is inside a blocked time window right now, with direct
     * per-user permissions on the module as an always-open fallback.
     */
    fun canAccessModule(user: User, module: ModuleConfig): Boolean {
        if (user.isAdmin) return true
        if (module.permissions.isEmpty()) return true
        val now = LocalDateTime.now()
        if (user.roles.any { module.id in it.moduleIds && !it.isBlockedAt(now) }) return true
        return user.permissions.any { it.endsWith(":${module.id}") }
    }

    // A full admin implicitly holds every administration permission; otherwise it must be
    // granted by at least one of the user's roles.
    fun hasAdminPermission(user: User, permission: AdminPermission): Boolean =
        permission.name in user.effectiveAdminPermissions()

    // Convenience for @PreAuthorize SpEL expressions (e.g. "@permissionService.currentUserHasAdminPermission('MODULE_INSTALL')"),
    // which can't easily thread a resolved User through to a method parameter.
    fun currentUserHasAdminPermission(permission: String): Boolean {
        val perm = AdminPermission.fromNameOrNull(permission) ?: return false
        val email = SecurityContextHolder.getContext().authentication?.name ?: return false
        val user = userRepository.findByEmail(email).orElse(null) ?: return false
        return hasAdminPermission(user, perm)
    }
}
