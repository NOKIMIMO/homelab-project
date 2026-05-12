package com.homelab.core.model.action

import com.homelab.core.model.data.GenericTableLayer

class ReadAction : Action {
    override fun execute(
        moduleId: String,
        mergedParams: Map<String, Any>,
        actionParams: Map<String, Any>?,
        genericObject: GenericTableLayer
    ): Any? {
        println("[ReadAction] invoked module=$moduleId params=${actionParams ?: mapOf()}")

        val filters = mutableMapOf<String, Any?>()
        if (mergedParams.containsKey("id")) filters["id"] = mergedParams["id"]

        // include any string params from mergedParams that are not already in filters
        for ((k, v) in mergedParams) {
            if (!filters.containsKey(k) && v is String) {
                filters[k] = v
            }
        }

        // actionParams can override or provide additional filters
        actionParams?.forEach { (k, v) -> filters[k] = v }

        val rows = genericObject.find(filters)
        val sanitized = rows.map { row ->
            val copy = row.toMutableMap()
            copy.remove("file")
            copy.remove("filePath")
            copy.remove("file_path")
            copy
        }
        return mapOf("rows" to sanitized)
    }
}

