package com.homelab.core.model.action

import com.homelab.core.helper.Formater
import com.homelab.core.helper.Formater.Companion.camelToSnake
import com.homelab.core.model.data.GenericTableLayer
import com.homelab.core.model.module.action.ModuleActionDeclaration
import com.homelab.core.model.module.action.ModuleActionParameterType

interface Action {
    /**
     * Execute the action.
     * @param moduleId module id where the action runs
     * @param mergedParams the full request params (including file if uploaded)
     * @param actionParams the per-action parameters (from module action logic, already resolved by controller)
     * @param genericObject the GenericTableLayer representing the data object
     * @param declaration the ModuleActionDeclaration from the module manifest (allows action to know declared parameters)
     * @return arbitrary result suitable for returning to caller (nullable)
     */
    fun execute(
        moduleId: String,
        mergedParams: Map<String, Any>,
        genericObject: GenericTableLayer,
        declaration: ModuleActionDeclaration
    ): Any?

    fun getFilters(mergedParams: Map<String, Any>,declaration: ModuleActionDeclaration): Map<String, Pair<Any?, ModuleActionParameterType>> {
        val filters = mutableMapOf<String, Pair<Any?, ModuleActionParameterType>>()

        val declaredParams = declaration.parameters
        println("[ReadAction] declaredParams=$declaredParams")
        if (declaredParams.isEmpty()) {
            if (mergedParams.containsKey("id")) filters["id"] = Pair(mergedParams["id"], ModuleActionParameterType.EQUAL)
        } else {
            for (p in declaredParams) {
                val variants = listOf(p.name, camelToSnake(p.name), p.name.lowercase())
                println("[ReadAction] variants=$variants")
                var found: Any? = null
                for (v in variants) {
                    if (mergedParams.containsKey(v)) { found = mergedParams[v]; break }
                }
                if (found != null) addFilter(filters, Pair(p.name,p.type), found)
            }
        }
        return filters
    }

    fun addFilter(filters: MutableMap<String, Pair<Any?,ModuleActionParameterType>>, key: Pair<String, ModuleActionParameterType>, value: Any?) {
        if (value == null) return
        val snake = camelToSnake(key.first)
        val storeKey = if (key.first == key.first.lowercase()) key.first else snake
        if (!filters.containsKey(storeKey)) filters[storeKey] = Pair(value, key.second)

        //TODO: recheck ça, move ?
        when (key.first.lowercase()) {
            "filename", "originalfilename" -> if (!filters.containsKey("file_name")) filters["file_name"] = Pair(value, key.second)
            "filepath" -> if (!filters.containsKey("file")) filters["file"] = Pair(value, key.second)
        }
    }
}