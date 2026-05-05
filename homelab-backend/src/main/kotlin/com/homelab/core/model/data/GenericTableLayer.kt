package com.homelab.core.model.data

class GenericTableLayer(private val tableDefinition: TableDefinition) {

    private val dataStore = mutableListOf<Map<String, Any?>>()

    fun create(item: Map<String, Any?>): Boolean {
        if (!validateItem(item)) {
            println("Validation failed for item: $item")
            return false
        }
        dataStore.add(item)
        println("Item added: $item")
        return true
    }

    fun read(predicate: (Map<String, Any?>) -> Boolean): List<Map<String, Any?>> {
        return dataStore.filter(predicate)
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
