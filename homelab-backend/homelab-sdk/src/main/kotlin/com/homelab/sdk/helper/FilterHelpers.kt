package com.homelab.sdk.helper

import com.homelab.sdk.module.action.ModuleActionDeclaration
import com.homelab.sdk.module.action.ModuleActionParameterType

object FilterHelpers {
    fun buildFilters(
        mergedParams: Map<String, Any>,
        declaration: ModuleActionDeclaration
    ): Map<String, Pair<Any?, ModuleActionParameterType>> {
        val filters = mutableMapOf<String, Pair<Any?, ModuleActionParameterType>>()

        val declaredParams = declaration.parameters
        if (declaredParams.isEmpty()) {
            if (mergedParams.containsKey("id")) filters["id"] = Pair(mergedParams["id"], ModuleActionParameterType.EQUAL)
        } else {
            for (p in declaredParams) {
                val variants = listOf(p.name, Formater.camelToSnake(p.name), p.name.lowercase())
                var found: Any? = null
                for (v in variants) {
                    if (mergedParams.containsKey(v)) {
                        found = mergedParams[v]
                        break
                    }
                }
                // None type are passed to action logic, those typed are for filtering in database layer
                if (found != null && p.type != ModuleActionParameterType.NONE) {
                    addFilter(filters, Pair(p.name, p.type), found)
                }
            }
        }
        return filters
    }

    fun addFilter(
        filters: MutableMap<String, Pair<Any?, ModuleActionParameterType>>,
        key: Pair<String, ModuleActionParameterType>,
        value: Any?
    ) {
        if (value == null) return
        val snake = Formater.camelToSnake(key.first)
        val storeKey = if (key.first == key.first.lowercase()) key.first else snake
        if (!filters.containsKey(storeKey)) filters[storeKey] = Pair(value, key.second)

        when (key.first.lowercase()) {
            "filename", "originalfilename" -> if (!filters.containsKey("file_name")) filters["file_name"] = Pair(value, key.second)
            "filepath" -> if (!filters.containsKey("file")) filters["file"] = Pair(value, key.second)
        }
    }
}

