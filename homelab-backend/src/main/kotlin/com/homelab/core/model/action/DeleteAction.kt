package com.homelab.core.model.action

import com.homelab.core.model.data.GenericTableLayer

class DeleteAction : Action {
    override fun execute(
        moduleId: String,
        mergedParams: Map<String, Any>,
        genericObject: GenericTableLayer,
        declaration: com.homelab.core.model.module.action.ModuleActionDeclaration
    ): Any {
        println("[DeleteAction] invoked module=$moduleId")
        println("[DeleteAction] mergedParams=$mergedParams")

        val filters = this.getFilters(mergedParams,declaration)

        val deleted = genericObject.delete(filters)
        return mapOf("deleted" to deleted)
    }
}

