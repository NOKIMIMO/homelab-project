package com.homelab.core.model.action

import com.homelab.sdk.action.Action
import com.homelab.sdk.data.GenericTableLayer
import com.homelab.sdk.module.action.ModuleActionDeclaration
import com.homelab.sdk.module.action.ModuleActionParameterType

class UpdateAction : Action {
    override fun execute(
        moduleId: String,
        mergedParams: Map<String, Any>,
        genericObject: GenericTableLayer,
        declaration: ModuleActionDeclaration
    ): Any {

        val filters = this.getFilters(mergedParams, declaration)

        val filterParamNames = declaration.parameters
            .filter { it.type != ModuleActionParameterType.NONE }
            .map { it.name }
            .toSet()

        val updateMap = mergedParams.filterKeys { it !in filterParamNames }

        val updated = genericObject.updateByFilters(filters, updateMap)
        return mapOf("updated" to updated)
    }
}
