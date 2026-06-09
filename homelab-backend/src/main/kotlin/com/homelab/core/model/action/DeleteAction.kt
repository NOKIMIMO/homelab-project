package com.homelab.core.model.action

import com.homelab.sdk.action.Action
import com.homelab.sdk.data.GenericTableLayer
import com.homelab.sdk.module.action.ModuleActionDeclaration

class DeleteAction : Action {
    override fun execute(
        moduleId: String,
        mergedParams: Map<String, Any>,
        genericObject: GenericTableLayer,
        declaration: ModuleActionDeclaration
    ): Any {

        val filters = this.getFilters(mergedParams,declaration)

        val deleted = genericObject.delete(filters)
        return mapOf("deleted" to deleted)
    }
}

