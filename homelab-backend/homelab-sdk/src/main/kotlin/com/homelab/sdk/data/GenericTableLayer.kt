package com.homelab.sdk.data

import com.homelab.sdk.helper.AppLogger
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
    private val log = AppLogger.loggerFor(GenericTableLayer::class)

    private val dataStore = mutableListOf<Map<String, Any?>>()
    fun create(item: Map<String, Any?>): Boolean {
        log.debug("Creating item in table ${tableDefinition.name}: $item")
        if (!validateItem(item)) {
            return false
        }

        val mdb = moduleDatabaseService
        if (mdb != null && moduleId != null) {
            try {
                val persisted = mdb.insertRow(moduleId, tableDefinition.name, item, tableDefinition)
                if (!persisted) {
                    val msg = "ModuleDatabaseService.insertRow returned false for ${tableDefinition.name}"
                    log.warn(msg)
                    throw RuntimeException(msg)
                }
            } catch (e: Exception) {
                log.error("Failed inserting row into database for module ${moduleId}, table ${tableDefinition.name}: ${e.message}", e)
                // propagate so action layer / controller can surface error details
                throw e
            }
        } else {
            persist?.let { p ->
                val persisted = try {
                    p(item)
                } catch (e: Exception) {
                    log.error("Persistence callback threw for table ${tableDefinition.name}: ${e.message}", e)
                    false
                }
                if (!persisted) {
                    log.error("Persistence callback returned false for table ${tableDefinition.name}, item: $item")
                    return false
                }
            }
        }

        dataStore.add(item)
        return true
    }

    fun find(filters: Map<String, Pair<Any?, ModuleActionParameterType>>): List<Map<String, Any?>> {
        log.debug("Finding items with filters: $filters")
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
                    log.error("Failed loading relations for rows in module ${moduleId}, table ${tableDefinition.name}: ${e.message}", e)
                    baseRows
                }
            } catch (e: Exception) {
                log.error("ModuleDatabaseService.queryRows threw for module ${moduleId}, table ${tableDefinition.name}: ${e.message}", e)
                emptyList()
            }
        }

        fetch?.let { f ->
            return try {
                f(filters)
            } catch (e: Exception) {
                log.error("Fetch callback threw for table ${tableDefinition.name}: ${e.message}", e)
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
                        log.error("Failed deleting file for column $col at ${row[col]}: ${e.message}", e)
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
            log.warn("No items matching predicate for update in table ${tableDefinition.name}")
            return false
        }

        var successCount = 0
        val mdb = moduleDatabaseService

        for (item in itemsToUpdate) {
            val updatedItem = updateFunction(item)

            if (!validateItem(updatedItem)) {
                log.warn("Validation failed for updated item in table ${tableDefinition.name}: $updatedItem")
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
                        log.warn("Cannot identify row for update in table ${tableDefinition.name}: no ID field found in item $item")
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
                        log.warn("No fields changed for update in table ${tableDefinition.name} for item with filters $filters")
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
                        log.warn("Database update affected 0 rows for table ${tableDefinition.name} with filters $filters and updateMap $updateMap")
                    }
                } catch (e: Exception) {
                    log.error("Failed updating row in database for module ${moduleId}, table ${tableDefinition.name}: ${e.message}", e)
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

        log.debug("Update completed for table ${tableDefinition.name}. Items updated: $successCount of ${itemsToUpdate.size}")
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
            log.warn("updateByFilters called with empty filters for table ${tableDefinition.name}, skipping to prevent mass update")
            return 0
        }

        val mdb = moduleDatabaseService
        if (mdb != null && moduleId != null) {
            val rowsAffected = try {
                mdb.updateRows(moduleId, tableDefinition.name, filters, updateMap)
            } catch (e: Exception) {
                log.error("Failed updating rows in database for module ${moduleId}, table ${tableDefinition.name} with filters $filters and updateMap $updateMap: ${e.message}", e)
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
                log.warn("Missing column ${column.name} in item for table ${tableDefinition.name}")
                return false
            }
            val value = item[column.name]
            if (!column.nullable && value == null) {
                log.warn("Non-nullable column ${column.name} has null value in table ${tableDefinition.name}")
                return false
            }
            if (column.regex != null && value is String && !Regex(column.regex).matches(value)) {
                log.warn("Value '$value' does not match regex '${column.regex}' for column ${column.name} in table ${tableDefinition.name}")
                return false
            }
        }
        return true
    }
}

