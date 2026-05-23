package com.homelab.core.model.action

import com.homelab.sdk.data.GenericTableLayer
import com.homelab.sdk.action.Action
import com.homelab.sdk.module.action.ModuleActionDeclaration

class ListAction : Action {
    override fun execute(
        moduleId: String,
        mergedParams: Map<String, Any>,
        genericObject: GenericTableLayer,
        declaration: ModuleActionDeclaration
    ): Any {
        println("[ListAction] invoked module=$moduleId")
        println("[ListAction] mergedParams=$mergedParams")

        val filters = getFilters(mergedParams,declaration)

        return genericObject.find(filters)
    }
}

