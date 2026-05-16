package com.homelab.core.model.action

import com.homelab.core.model.data.GenericTableLayer

class ListAction : Action {
    override fun execute(
        moduleId: String,
        mergedParams: Map<String, Any>,
        genericObject: GenericTableLayer,
        declaration: com.homelab.core.model.module.action.ModuleActionDeclaration
    ): Any {
        println("[ListAction] invoked module=$moduleId")
        println("[ListAction] mergedParams=$mergedParams")

        val filters = getFilters(mergedParams,declaration)

        return genericObject.find(filters)
    }
}

