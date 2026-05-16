package com.homelab.core.model.action

import com.homelab.core.model.data.GenericTableLayer
import com.homelab.core.model.module.action.ModuleActionParameterType
import kotlin.collections.mutableMapOf

class ReadAction : Action {
    override fun execute(
        moduleId: String,
        mergedParams: Map<String, Any>,
        genericObject: GenericTableLayer,
        declaration: com.homelab.core.model.module.action.ModuleActionDeclaration
    ): Any {
        println("[ReadAction] invoked module=$moduleId")
        println("[ReadAction] mergedParams=$mergedParams")

        val filters = getFilters(mergedParams,declaration)

        val rows = genericObject.find(filters)
        val sanitized = rows.map { row ->
            val copy = row.toMutableMap()
            // remove sensitive data
            // TODO: move that into the generic Layer for serialization
            copy.remove("file")
            copy.remove("filePath")
            copy.remove("file_path")
            copy
        }
        return mapOf("rows" to sanitized)
    }


}

