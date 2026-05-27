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

    fun create(item: Map<String, Any?>): Boolean {
        if (!validateItem(item)) {
            println("Validation failed for item: $item")
            return false
        }

        val mdb = moduleDatabaseService
        if (mdb != null && moduleId != null) {
            val persisted = try {
                mdb.insertRow(moduleId, tableDefinition.name, item, tableDefinition)
            } catch (e: Exception) {
                println("ModuleDatabaseService.insertRow threw: ${e.message}")
                false
            }
            if (!persisted) {
                println("Persistence failed for item via ModuleDatabaseService: $item")
                return false
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
                mdb.queryRows(moduleId, tableDefinition.name, rawFilters)
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

        val fileCols = tableDefinition.columns.filter { it.type.equals("file", true) }.map { it.name }.toMutableSet()
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

    //Placeholder, will modify later
    fun update(predicate: (Map<String, Any?>) -> Boolean, updateFunction: (Map<String, Any?>) -> Map<String, Any?>): Boolean {
        val itemsToUpdate = dataStore.filter(predicate)
        if (itemsToUpdate.isEmpty()) return false

        itemsToUpdate.forEach { item ->
            val updatedItem = updateFunction(item)
            if (validateItem(updatedItem)) {
                dataStore[dataStore.indexOf(item)] = updatedItem
            } else {
                println("Validation failed for updated item: $updatedItem")
            }
        }
        println("Items updated: $itemsToUpdate")
        return true
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

