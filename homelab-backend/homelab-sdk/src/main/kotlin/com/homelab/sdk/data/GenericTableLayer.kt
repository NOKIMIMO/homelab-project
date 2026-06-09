package com.homelab.sdk.data

import com.homelab.sdk.module.action.ModuleActionParameterType
import java.nio.file.Files
import java.nio.file.Path

class GenericTableLayer(
    private val tableDefinition: TableDefinition,
    private val persist: ((item: Map<String, Any?>) -> Boolean)? = null,
    private val fetch: ((filters: Map<String, Any?>) -> List<Map<String, Any?>>)? = null,

    private val moduleDatabaseService: ModuleDatabaseService? = null,
    private val moduleId: String? = null
 ) {

    private val dataStore = mutableListOf<Map<String, Any?>>()
    //TODO: maybe use the logger of core?
    // pass logger into sdk ?
    fun create(item: Map<String, Any?>): Boolean {
        if (!validateItem(item)) {
            //println("Validation failed for item: $item")
            return false
        }

        val mdb = moduleDatabaseService
        if (mdb != null && moduleId != null) {
            try {
                val persisted = mdb.insertRow(moduleId, tableDefinition.name, item, tableDefinition)
                if (!persisted) {
                    val msg = "ModuleDatabaseService.insertRow returned false for ${tableDefinition.name}"
                    println("[GenericTableLayer] $msg")
                    throw RuntimeException(msg)
                }
            } catch (e: Exception) {
                println("[GenericTableLayer] ModuleDatabaseService.insertRow threw: ${e.message}")
                // propagate so action layer / controller can surface error details
                throw e
            }
        } else {
            persist?.let { p ->
                val persisted = try {
                    p(item)
                } catch (e: Exception) {
                    println("Persistence callback threw: ${e.message}")
                    false
                }
                if (!persisted) {
                    println("Persistence failed for item: $item")
                    return false
                }
            }
        }

        dataStore.add(item)
        return true
    }

    fun find(filters: Map<String, Pair<Any?, ModuleActionParameterType>>): List<Map<String, Any?>> {
        println("[Generic Layer] filter: $filters")
        val mdb = moduleDatabaseService
        if (mdb != null && moduleId != null) {
            return try {
                // convert SDK-layer typed filters (Pair<value, operator>) into a raw map
                // where values are Any? so the ModuleDatabaseService implementation can parse them
                val rawFilters: Map<String, Any?> = filters.mapValues { it.value as Any? }
                val baseRows = mdb.queryRows(moduleId, tableDefinition.name, rawFilters)
                if (tableDefinition.relations.isEmpty()) return baseRows

                // Ask DB service to enrich the base rows with relations (keeps SQL and connections in DB layer)
                try {
                    mdb.loadRelationsForRows(moduleId, tableDefinition.name, baseRows)
                } catch (e: Exception) {
                    println("ModuleDatabaseService.loadRelationsForRows threw: ${e.message}")
                    baseRows
                }
            } catch (e: Exception) {
                println("ModuleDatabaseService.queryRows threw: ${e.message}")
                emptyList()
            }
        }

        fetch?.let { f ->
            return try {
                f(filters)
            } catch (e: Exception) {
                println("Fetch callback threw: ${e.message}")
                emptyList()
            }
        }

        if (filters.isEmpty()) return dataStore.toList()
        // Note: in-memory relation enrichment is not implemented here. For DB-backed flows
        // relation enrichment is performed by the ModuleDatabaseService. Implementing in-memory
        // joins would require access to other tables' data stores or a registry and is left
        // for a future enhancement.
        return dataStore.filter { item ->
            filters.entries.all { (k, v) ->
                if (!item.containsKey(k)) return@all false
                item[k] == v
            }
        }
    }

    fun delete(filters: Map<String, Pair<Any?, ModuleActionParameterType>>): Int {
        val rows = find(filters)
        if (rows.isEmpty()) return 0

                                        val fileCols = tableDefinition.columns.filter { it.type == ColumnTyping.file }.map { it.name }.toMutableSet()
        fileCols.add("file")
        fileCols.add("file_name")

        for (row in rows) {
            for (col in fileCols) {
                val v = row[col]
                if (v is String) {
                    try {
                        val p = Path.of(v)
                        if (Files.exists(p)) {
                            Files.delete(p)
                        }
                    } catch (e: Exception) {
                        println("Failed deleting file for column $col at ${row[col]}: ${e.message}")
                    }
                }
            }
        }

        var deleted = 0
        val mdb = moduleDatabaseService
        if (mdb != null && moduleId != null) {
            val rawFilters: Map<String, Any?> = filters.mapValues { it.value as Any? }
            deleted = mdb.deleteRowsByFilters(moduleId, tableDefinition.name, rawFilters)
        }

        dataStore.removeIf { item ->
            filters.entries.all { (k, v) ->
                if (!item.containsKey(k)) return@all false
                item[k] == v
            }
        }

        return deleted
    }

    /**
     * Update rows matching a predicate, applying the updateFunction to each.
     * Persists changes to the database if ModuleDatabaseService is available.
     *
     * @param predicate Function to select rows to update
     * @param updateFunction Function to transform selected rows
     * @return true if at least one row was updated successfully
     */
    fun update(predicate: (Map<String, Any?>) -> Boolean, updateFunction: (Map<String, Any?>) -> Map<String, Any?>): Boolean {
        val itemsToUpdate = dataStore.filter(predicate)
        if (itemsToUpdate.isEmpty()) {
            println("No items matching predicate for update")
            return false
        }

        var successCount = 0
        val mdb = moduleDatabaseService

        for (item in itemsToUpdate) {
            val updatedItem = updateFunction(item)

            if (!validateItem(updatedItem)) {
                println("Validation failed for updated item: $updatedItem")
                continue
            }

            // Persist to database if available
            if (mdb != null && moduleId != null) {
                try {
                    // Build filters to identify this specific row (target by all non-null ID-like fields)
                    val filters = mutableMapOf<String, Any?>()

                    // Try to find a unique key (id, uuid, etc.)
                    listOf("id", "uuid", "pk").forEach { keyName ->
                        if (item.containsKey(keyName) && item[keyName] != null) {
                            filters[keyName] = item[keyName]!!
                            return@forEach
                        }
                    }

                    if (filters.isEmpty()) {
                        println("Cannot identify row for update: no ID field found")
                        continue
                    }

                    // Extract only the fields that changed
                    val updateMap = mutableMapOf<String, Any?>()
                    tableDefinition.columns.forEach { col ->
                        if (updatedItem.containsKey(col.name)) {
                            val oldVal = item[col.name]
                            val newVal = updatedItem[col.name]
                            if (oldVal != newVal) {
                                updateMap[col.name] = newVal
                            }
                        }
                    }

                    if (updateMap.isEmpty()) {
                        println("No fields changed for update")
                        continue
                    }

                    val rowsAffected = mdb.updateRows(moduleId, tableDefinition.name, filters, updateMap)
                    if (rowsAffected > 0) {
                        // Update in-memory store
                        val idx = dataStore.indexOf(item)
                        if (idx >= 0) {
                            dataStore[idx] = updatedItem
                            successCount++
                        }
                    } else {
                        println("No rows updated in database for filters: $filters")
                    }
                } catch (e: Exception) {
                    println("Database update failed: ${e.message}")
                    e.printStackTrace()
                }
            } else {
                // No database, just update in-memory
                val idx = dataStore.indexOf(item)
                if (idx >= 0) {
                    dataStore[idx] = updatedItem
                    successCount++
                }
            }
        }

        println("Items updated: $successCount of ${itemsToUpdate.size}")
        return successCount > 0
    }

    /**
     * Update rows matching filters with specific field changes.
     * Simpler interface: directly specify which fields to update.
     *
     * @param filters WHERE clause (ex: {id: "uuid-123"})
     * @param updateMap Fields to modify (ex: {status: "active", count: 5})
     * @return Number of rows affected
     */
    fun updateByFilters(filters: Map<String, Any?>, updateMap: Map<String, Any?>): Int {
        if (filters.isEmpty()) {
            println("updateByFilters: no filters provided, skipping for safety")
            return 0
        }

        val mdb = moduleDatabaseService
        if (mdb != null && moduleId != null) {
            val rowsAffected = try {
                mdb.updateRows(moduleId, tableDefinition.name, filters, updateMap)
            } catch (e: Exception) {
                println("ModuleDatabaseService.updateRows threw: ${e.message}")
                0
            }

            if (rowsAffected > 0) {
                // Refresh in-memory store
                dataStore.clear()
                val updated = mdb.queryRows(moduleId, tableDefinition.name, emptyMap())
                dataStore.addAll(updated)
            }
            return rowsAffected
        }

        return 0
    }

    private fun validateItem(item: Map<String, Any?>): Boolean {
        for (column in tableDefinition.columns) {
            if (!item.containsKey(column.name)) {
                println("Missing column: ${column.name}")
                return false
            }
            val value = item[column.name]
            if (!column.nullable && value == null) {
                println("Non-nullable column ${column.name} has null value")
                return false
            }
            if (column.regex != null && value is String && !Regex(column.regex).matches(value)) {
                println("Value $value does not match regex for column ${column.name}")
                return false
            }
        }
        return true
    }
}

