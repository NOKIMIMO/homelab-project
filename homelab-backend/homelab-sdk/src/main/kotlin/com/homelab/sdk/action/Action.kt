package com.homelab.sdk.action

import com.homelab.sdk.data.GenericTableLayer
import com.homelab.sdk.helper.FilterHelpers
import com.homelab.sdk.module.action.ModuleActionDeclaration
import com.homelab.sdk.module.action.ModuleActionParameterType

/**
 * Minimal Action interface for plugins. Implemented by plugin actions packaged in the plugin JAR.
 */
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
        return FilterHelpers.buildFilters(mergedParams, declaration)
    }

    fun addFilter(filters: MutableMap<String, Pair<Any?,ModuleActionParameterType>>, key: Pair<String, ModuleActionParameterType>, value: Any?) {
        FilterHelpers.addFilter(filters, key, value)
    }
}
