package com.homelab.core.action

import com.homelab.core.model.action.*
import com.homelab.core.plugin.PluginRegistry
import com.homelab.sdk.action.Action
import org.springframework.stereotype.Service

@Service
class ActionFactory(private val pluginRegistry: PluginRegistry) {
    private val builtins: Map<String, Action>

    init {
        builtins = mapOf(
            ActionsEnum.UPLOAD_FILE.name to UploadFileAction(),
            ActionsEnum.GET_FILE.name to GetFileAction(),
            ActionsEnum.DELETE.name to DeleteAction(),
            ActionsEnum.LIST.name to ListAction(),
            ActionsEnum.READ.name to ReadAction()
        )
    }

    fun resolve(typeName: String): Action? {
        val byBuiltin = builtins[typeName]
        if (byBuiltin != null) return byBuiltin
        return pluginRegistry.getAction(typeName)
    }

    /**
     * Return available action type names (builtins + plugin-provided)
     */
    fun getAvailableActionTypes(): List<String> {
        val pluginTypes = pluginRegistry.getRegisteredTypes()
        return builtins.keys.toList() + pluginTypes
    }
}

