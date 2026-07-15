package com.homelab.core.action

import com.homelab.core.model.action.*
import com.homelab.core.plugin.PluginRegistry
import com.homelab.core.service.GlobalParametersService
import com.homelab.core.service.ResourceLimitsService
import com.homelab.sdk.action.Action
import org.postgresql.util.LruCache
import org.springframework.stereotype.Service

@Service
class ActionFactory(
    private val pluginRegistry: PluginRegistry,
    private val globalParametersService: GlobalParametersService,
    private val resourceLimitsService: ResourceLimitsService
) {
    private val builtins: Map<String, Action> = mapOf(
        ActionsEnum.UPLOAD_FILE.name to UploadFileAction(resourceLimitsService),
        ActionsEnum.GET_FILE.name to GetFileAction(),
        ActionsEnum.DELETE.name to DeleteAction(),
        ActionsEnum.CREATE.name to SimpleCreateAction(),
        ActionsEnum.LIST.name to ListAction(),
        ActionsEnum.READ.name to ReadAction(),
        ActionsEnum.UPDATE.name to UpdateAction(),
        ActionsEnum.FETCH_EXTERNAL.name to FetchExternalAction(globalParametersService),
        ActionsEnum.FETCH_EXTERNAL_GENERIC.name to GenericFetchExternalAction(globalParametersService)
    )

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

