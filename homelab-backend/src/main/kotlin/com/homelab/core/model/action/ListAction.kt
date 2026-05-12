package com.homelab.core.model.action

import com.homelab.core.model.data.GenericTableLayer

class ListAction : Action {
    override fun execute(
        moduleId: String,
        mergedParams: Map<String, Any>,
        actionParams: Map<String, Any>?,
        genericObject: GenericTableLayer
    ): Any? {
        println("[ListAction] invoked module=$moduleId params=${actionParams ?: mapOf()}")

        // If actionParams provides filters, use them
        val filters = mutableMapOf<String, Any?>()
        actionParams?.forEach { (k, v) -> filters[k] = v }

        return genericObject.find(filters)
    }
}

