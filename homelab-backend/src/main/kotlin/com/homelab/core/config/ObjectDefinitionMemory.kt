package com.homelab.core.config

import com.homelab.sdk.data.TableDefinition
import org.springframework.stereotype.Component
import kotlin.collections.set

@Component
class ObjectDefinitionMemory {

    private val definitions = mutableMapOf<String, TableDefinition>()

    fun put(moduleId: String, config: TableDefinition) {
        val key = listOf(moduleId, config.name).joinToString("_")
        definitions[key] = config
    }

    fun getDefinition(moduleId: String, obj:String): TableDefinition? {
        val key = listOf(moduleId,obj).joinToString("_")
        return definitions[key]
    }


    fun getAllDefinitions(): List<TableDefinition> =
        definitions.values.toList()

    fun contains(moduleId: String): Boolean =
        definitions.containsKey(moduleId)

    fun clear() {
        definitions.clear()
    }
}