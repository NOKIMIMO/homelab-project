package com.homelab.core.model.action

import com.homelab.sdk.data.GenericTableLayer
import com.homelab.sdk.action.Action
import com.homelab.sdk.module.action.ModuleActionDeclaration

class ReadAction : Action {
    override fun execute(
        moduleId: String,
        mergedParams: Map<String, Any>,
        genericObject: GenericTableLayer,
        declaration: ModuleActionDeclaration
    ): Any {
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

