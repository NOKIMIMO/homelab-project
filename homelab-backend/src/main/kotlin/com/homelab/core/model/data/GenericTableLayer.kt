package com.homelab.core.model.data

import com.homelab.core.service.module.ModuleDatabaseService
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

        if (moduleDatabaseService != null && moduleId != null) {
            val persisted = try {
                moduleDatabaseService.insertRow(moduleId, tableDefinition.name, item, tableDefinition)
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

    fun read(predicate: (Map<String, Any?>) -> Boolean): List<Map<String, Any?>> {
        return dataStore.filter(predicate)
    }


    fun find(filters: Map<String, Any?>): List<Map<String, Any?>> {
        if (moduleDatabaseService != null && moduleId != null) {
            return try {
                moduleDatabaseService.queryRows(moduleId, tableDefinition.name, filters)
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
                item.containsKey(k) && (v == null || item[k] == v)
            }
        }
    }

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

    fun delete(predicate: (Map<String, Any?>) -> Boolean): Boolean {
        val itemsToDelete = dataStore.filter(predicate)
        if (itemsToDelete.isEmpty()) return false

        dataStore.removeAll(itemsToDelete)
        println("Items deleted: $itemsToDelete")
        return true
    }

    fun deleteByFilters(filters: Map<String, Any?>): Int {
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
        if (moduleDatabaseService != null && moduleId != null) {
            val ids = rows.mapNotNull { it["id"] }
            deleted = if (ids.isNotEmpty()) {
                moduleDatabaseService.deleteRowsByIds(moduleId, tableDefinition.name, "id", ids)
            } else {
                moduleDatabaseService.deleteRowsByFilters(moduleId, tableDefinition.name, filters)
            }
        }

        dataStore.removeIf { item ->
            filters.entries.all { (k, v) -> item.containsKey(k) && (v == null || item[k] == v) }
        }

        return deleted
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

    fun getTableDefinition(): TableDefinition {
        return tableDefinition
    }
}
