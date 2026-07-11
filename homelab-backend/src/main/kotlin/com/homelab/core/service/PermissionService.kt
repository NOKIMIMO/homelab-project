package com.homelab.core.service

import com.homelab.core.model.auth.User
import com.homelab.core.model.module.ModuleConfig
import com.homelab.sdk.module.action.ModuleActionDeclaration
import org.springframework.stereotype.Service

@Service
class PermissionService {

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
        return user.permissions.containsAll(required)
    }
}
