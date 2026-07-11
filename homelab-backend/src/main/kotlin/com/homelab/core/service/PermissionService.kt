package com.homelab.core.service

import com.homelab.core.model.auth.User
import com.homelab.core.model.module.ModuleConfig
import com.homelab.core.model.module.ModuleSettings
import com.homelab.core.model.module.ModuleSettingsRepository
import com.homelab.sdk.module.action.ModuleActionDeclaration
import org.springframework.stereotype.Service
import java.time.LocalDateTime

@Service
class PermissionService(private val repository: ModuleSettingsRepository) {

    private val writeTypes = setOf("CREATE", "UPDATE", "PUT", "UPLOAD_FILE")
    private val deleteTypes = setOf("DELETE")

    private fun verbFor(actionType: String): String? = when (actionType) {
        in writeTypes -> "write"
        in deleteTypes -> "delete"
        else -> null
    }

    /**
     * Reads are open to any authenticated user. Writes and deletes are open by
     * default, unless an admin has flipped the module's write/delete toggle.
     */
    fun canInvoke(user: User, module: ModuleConfig, decl: ModuleActionDeclaration): Boolean {
        if (user.isAdmin) return true
        val verbs = decl.logic.mapNotNull { verbFor(it.type) }.toSet()
        if (verbs.isEmpty()) return true
        val settings = repository.findByModuleId(module.id)
        if ("write" in verbs && settings?.writeAdminOnly == true) return false
        if ("delete" in verbs && settings?.deleteAdminOnly == true) return false
        return true
    }

    fun getSettings(moduleId: String): ModuleSettings =
        repository.findByModuleId(moduleId) ?: ModuleSettings(moduleId = moduleId)

    fun updateSettings(moduleId: String, writeAdminOnly: Boolean, deleteAdminOnly: Boolean): ModuleSettings {
        val current = repository.findByModuleId(moduleId) ?: ModuleSettings(moduleId = moduleId)
        current.writeAdminOnly = writeAdminOnly
        current.deleteAdminOnly = deleteAdminOnly
        current.updatedAt = LocalDateTime.now()
        return repository.save(current)
    }
}
