package com.homelab.core.service.module
import com.homelab.core.model.data.ColumnDefinition
import com.homelab.core.model.data.TableDefinition
import org.springframework.stereotype.Service
import javax.sql.DataSource

@Service
class ModuleDatabaseService(
    private val dataSource: DataSource
) {
    data class DatabaseConnectionInfo(
            val host: String,
            val port: Int,
            val database: String,
            val username: String,
            val password: String
    )

    fun ensureModuleDatabaseReady(moduleId: String): Boolean {
        val schemaName = safeSqlName(moduleId)

        return try {
            dataSource.connection.use { connection ->
                connection.autoCommit = true

                val exists = connection.prepareStatement(
                    "SELECT 1 FROM information_schema.schemata WHERE schema_name = ?"
                ).use { stmt ->
                    stmt.setString(1, schemaName)
                    stmt.executeQuery().use { rs -> rs.next() }
                }

                if (!exists) {
                    connection.createStatement().use { st ->
                        st.execute("""CREATE SCHEMA "$schemaName"""")
                    }
                    println("Created module schema '$schemaName'")
                }

                true
            }
        } catch (e: Exception) {
            println("Failed ensuring module schema '$schemaName': ${e.message}")
            false
        }
    }

    fun setUpModuleDataObject(moduleId: String, objectsDefinition: TableDefinition): Boolean {
        val schemaName = safeSqlName(moduleId)
        val tableName = safeSqlName(objectsDefinition.name)

        val sql = buildCreateTableSql(schemaName, tableName, objectsDefinition)

        return try {
            dataSource.connection.use { connection ->
                connection.createStatement().use { statement ->
                    // TODO: we should ideally check if the table exists and matches the definition,
                    //  but i don't want to do reconciliation rn
                    statement.execute(sql)
                }
            }

            true
        } catch (e: Exception) {
            println("Failed setting up table \"$schemaName\".\"$tableName\": ${e.message}")
            false
        }
    }

    private fun buildCreateTableSql(
        schemaName: String,
        tableName: String,
        definition: TableDefinition
    ): String {
        val columns = listOf(
            "id UUID PRIMARY KEY DEFAULT gen_random_uuid()",
            "created_at TIMESTAMP NOT NULL DEFAULT now()",
            "updated_at TIMESTAMP NOT NULL DEFAULT now()"
        ) + definition.columns.map { buildColumnSql(it) }

        return """
            CREATE TABLE IF NOT EXISTS "$schemaName"."$tableName" (
                ${columns.joinToString(",\n")}
            )
        """.trimIndent()
    }

    private fun buildColumnSql(column: ColumnDefinition): String {
        val columnName = safeSqlName(column.name)

        val sqlType = when (column.type.lowercase()) {
            "string" -> "VARCHAR(1028)"
            "int", "integer" -> "INTEGER"
            "long" -> "BIGINT"
            "boolean" -> "BOOLEAN"
            "date" -> "DATE"
            "datetime" -> "TIMESTAMP"
            else -> error("Unsupported column type: ${column.type}")
        }

        val nullable = if (column.nullable) "" else " NOT NULL"
        val unique = if (column.unique) " UNIQUE" else ""

        return """"$columnName" $sqlType$nullable$unique"""
    }

    private fun safeSqlName(name: String): String {
        val normalized = name.trim()
            .replace(Regex("[^a-zA-Z0-9_]"), "_")
            .lowercase()

        require(normalized.matches(Regex("[a-z_][a-z0-9_]*"))) {
            "Invalid SQL name: $name"
        }

        return normalized
    }

}
