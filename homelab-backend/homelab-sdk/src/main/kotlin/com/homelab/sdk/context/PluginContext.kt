package com.homelab.sdk.context

import com.homelab.sdk.filter.FilterSpec
import com.homelab.sdk.module.action.ModuleActionDeclaration

/**
 * Richer execution context exposed to plugin actions. The implementation is provided by the core
 * at execution time and adapts the core's data layer to this interface.
 */
interface PluginContext {
    fun moduleId(): String

    /**
     * Find rows matching the provided filter specs.
     */
    fun find(filters: List<FilterSpec>): List<Map<String, Any?>>

    /**
     * Convenience: find a single row or null.
     */
    fun findOne(filters: List<FilterSpec>): Map<String, Any?>?

    /**
     * Update rows matching predicate using updateFunction. Returns true if any rows were updated.
     */
    fun update(predicate: (Map<String, Any?>) -> Boolean, updateFunction: (Map<String, Any?>) -> Map<String, Any?>): Boolean

    fun create(item: Map<String, Any?>): Boolean

    fun delete(filters: List<FilterSpec>): Int

    fun declaration(): ModuleActionDeclaration

    fun log(level: String, msg: String)
}
