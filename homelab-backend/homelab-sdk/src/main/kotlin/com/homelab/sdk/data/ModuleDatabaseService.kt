package com.homelab.sdk.data

/**
 * Public SDK interface that allows code outside the core module (plugins, tests, etc.)
 * to interact with a module-scoped database provider implemented by the core application.
 *
 * The concrete implementation lives in the core module and implements this interface.
 */
interface ModuleDatabaseService {
    fun ensureModuleDatabaseReady(moduleId: String): Boolean

    fun setUpModuleDataObject(moduleId: String, objectsDefinition: TableDefinition): Boolean

    fun insertRow(
        moduleId: String,
        tableName: String,
        item: Map<String, Any?>,
        definition: TableDefinition
    ): Boolean

    fun queryRows(moduleId: String, tableName: String, filters: Map<String, Any?>): List<Map<String, Any?>>

    fun deleteRowsByFilters(moduleId: String, tableName: String, filters: Map<String, Any?>): Int
}

