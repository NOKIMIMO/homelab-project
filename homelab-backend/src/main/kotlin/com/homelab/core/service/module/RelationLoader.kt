package com.homelab.core.service.module

import com.homelab.sdk.data.Cardinality
import com.homelab.sdk.data.TableDefinition
import java.sql.Connection
import java.util.LinkedHashMap

/**
 * Responsible for loading relation data for a set of base rows.
 * Provides a simple in-memory LRU cache for fetched rows to reduce repeated DB hits.
 * Cache size is expressed in kilobytes (approximate string-size of row representations).
 */
class RelationLoader(private val maxCacheKB: Int = 1024) {

    private data class CacheEntry(val row: Map<String, Any?>, val sizeKB: Int)

    // key = "schema.table.id" -> CacheEntry
    private val cache = object : LinkedHashMap<String, CacheEntry>(128, 0.75f, true) {}
    private var currentSizeKB = 0

    private fun cacheKey(schema: String, table: String, id: Any?): String = "$schema.$table.$id"

    private fun estimateSizeKB(row: Map<String, Any?>): Int {
        val bytes = row.toString().toByteArray().size
        return (bytes + 1023) / 1024
    }

    private fun putInCache(schema: String, table: String, row: Map<String, Any?>) {
        val id = row["id"] ?: return
        val key = cacheKey(schema, table, id)
        val sizeKB = estimateSizeKB(row)
        val prev = cache.put(key, CacheEntry(row, sizeKB))
        if (prev != null) {
            currentSizeKB -= prev.sizeKB
        }
        currentSizeKB += sizeKB
        // Evict until under limit
        val it = cache.entries.iterator()
        while (currentSizeKB > maxCacheKB && it.hasNext()) {
            val e = it.next()
            currentSizeKB -= e.value.sizeKB
            it.remove()
        }
    }

    private fun getFromCache(schema: String, table: String, id: Any?): Map<String, Any?>? {
        if (id == null) return null
        val key = cacheKey(schema, table, id)
        val entry = cache[key]
        return entry?.row
    }

    fun loadRelations(
        connection: Connection,
        schema: String,
        table: String,
        definition: TableDefinition,
        rows: List<Map<String, Any?>>
    ): List<Map<String, Any?>> {

        val result = rows.map { it.toMutableMap() }
        val baseIds = rows.mapNotNull { it["id"] }

        for (relation in definition.relations) {
            when (relation.cardinality) {
                Cardinality.MANY_TO_MANY -> {
                    val joinTable = listOf(table, relation.targetTable).sorted().joinToString("_")
                    val fkSource = "${table}_id"
                    val fkTarget = "${relation.targetTable}_id"

                    if (baseIds.isEmpty()) {
                        result.forEach { row -> row[relation.targetTable] = emptyList<Any>() }
                        continue
                    }

                    val placeholders = baseIds.joinToString(",") { "?" }
                    val sql = """
                    SELECT * FROM "$schema"."$joinTable"
                    WHERE "$fkSource" IN ($placeholders)
                """.trimIndent()

                    val map = mutableMapOf<Any, MutableList<Map<String, Any?>>>()

                    connection.prepareStatement(sql).use { stmt ->
                        baseIds.forEachIndexed { i, id -> stmt.setObject(i + 1, id) }

                        stmt.executeQuery().use { rs ->
                            while (rs.next()) {
                                val parentId = rs.getObject(fkSource)
                                val targetId = rs.getObject(fkTarget)

                                val targetRow = fetchSingleRowCached(connection, schema, relation.targetTable, targetId)

                                if (targetRow != null) {
                                    map.computeIfAbsent(parentId) { mutableListOf() }.add(targetRow)
                                }
                            }
                        }
                    }

                    result.forEach { row ->
                        val id = row["id"]
                        row[relation.targetTable] = map[id] ?: emptyList<Any>()
                    }
                }
                Cardinality.MANY_TO_ONE -> {
                    val fk = "${relation.targetTable}_id"
                    val targetIds = rows.mapNotNull { it[fk] }.distinct()
                    val targets = fetchBatchCached(connection, schema, relation.targetTable, targetIds)
                    val targetMap = targets.associateBy { it["id"] }
                    result.forEach { row ->
                        val fkValue = row[fk]
                        row[relation.targetTable] = targetMap[fkValue]
                    }
                }
                Cardinality.ONE_TO_MANY -> {
                    val fk = "${table}_id"
                    val children = fetchChildren(connection, schema, relation.targetTable, fk, baseIds)
                    // cache children rows individually
                    children.forEach { putInCache(schema, relation.targetTable, it) }
                    val grouped = children.groupBy { it[fk] }
                    result.forEach { row ->
                        val id = row["id"]
                        row[relation.targetTable] = grouped[id] ?: emptyList<Any>()
                    }
                }
                Cardinality.ONE_TO_ONE -> {
                    val fk = "${relation.targetTable}_id"
                    val targetIds = rows.mapNotNull { it[fk] }.distinct()
                    val targets = fetchBatchCached(connection, schema, relation.targetTable, targetIds)
                    val map = targets.associateBy { it["id"] }
                    result.forEach { row ->
                        val fkValue = row[fk]
                        row[relation.targetTable] = map[fkValue]
                    }
                }
            }
        }

        return result
    }

    private fun fetchBatchCached(
        connection: Connection,
        schema: String,
        table: String,
        ids: List<Any>
    ): List<Map<String, Any?>> {
        if (ids.isEmpty()) return emptyList()

        val missing = mutableListOf<Any>()
        val result = mutableListOf<Map<String, Any?>>()

        // first try cache
        for (id in ids) {
            val cached = getFromCache(schema, table, id)
            if (cached != null) {
                result.add(cached)
            } else {
                missing.add(id)
            }
        }

        if (missing.isEmpty()) return result

        val placeholders = missing.joinToString(",") { "?" }
        val sql = """SELECT * FROM "$schema"."$table" WHERE id IN ($placeholders)"""

        connection.prepareStatement(sql).use { stmt ->
            missing.forEachIndexed { i, id -> stmt.setObject(i + 1, id) }
            stmt.executeQuery().use { rs ->
                val md = rs.metaData
                while (rs.next()) {
                    val row = mutableMapOf<String, Any?>()
                    for (i in 1..md.columnCount) {
                        row[md.getColumnLabel(i)] = rs.getObject(i)
                    }
                    // cache and add
                    putInCache(schema, table, row)
                    result.add(row)
                }
            }
        }

        return result
    }

    private fun fetchSingleRowCached(
        connection: Connection,
        schema: String,
        table: String,
        id: Any?
    ): Map<String, Any?>? {
        if (id == null) return null
        val cached = getFromCache(schema, table, id)
        if (cached != null) return cached

        val sql = """SELECT * FROM "$schema"."$table" WHERE id = ?"""
        connection.prepareStatement(sql).use { stmt ->
            stmt.setObject(1, id)
            stmt.executeQuery().use { rs ->
                if (!rs.next()) return null
                val md = rs.metaData
                val row = mutableMapOf<String, Any?>()
                for (i in 1..md.columnCount) {
                    row[md.getColumnLabel(i)] = rs.getObject(i)
                }
                putInCache(schema, table, row)
                return row
            }
        }
    }

    private fun fetchChildren(
        connection: Connection,
        schema: String,
        table: String,
        foreignKey: String,
        parentIds: List<Any>
    ): List<Map<String, Any?>> {
        if (parentIds.isEmpty()) return emptyList()

        val placeholders = parentIds.joinToString(",") { "?" }
        val sql = """
        SELECT * FROM "$schema"."$table"
        WHERE "$foreignKey" IN ($placeholders)
    """.trimIndent()

        val result = mutableListOf<Map<String, Any?>>()

        connection.prepareStatement(sql).use { stmt ->
            parentIds.forEachIndexed { i, id -> stmt.setObject(i + 1, id) }
            stmt.executeQuery().use { rs ->
                val md = rs.metaData
                while (rs.next()) {
                    val row = mutableMapOf<String, Any?>()
                    for (i in 1..md.columnCount) {
                        row[md.getColumnLabel(i)] = rs.getObject(i)
                    }
                    result.add(row)
                }
            }
        }

        return result
    }
}

