package com.homelab.core.model.action

import com.homelab.core.model.data.GenericTableLayer

class DeleteAction : Action {
    override fun execute(
        moduleId: String,
        mergedParams: Map<String, Any>,
        actionParams: Map<String, Any>?,
        genericObject: GenericTableLayer
    ): Any? {
        println("[DeleteAction] invoked module=$moduleId params=${actionParams ?: mapOf()}")

        val filters = mutableMapOf<String, Any?>()
        if (mergedParams.containsKey("id")) filters["id"] = mergedParams["id"]

        val deleted = genericObject.deleteByFilters(filters)
        return mapOf("deleted" to deleted)
    }
}

