package com.homelab.core.service.module
import java.net.URI
import java.sql.DriverManager
import org.springframework.beans.factory.annotation.Value
import org.springframework.stereotype.Service

@Service
class ModuleDatabaseService(
    @Value("\${spring.datasource.url}") private val datasourceUrl: String,
    @Value("\${spring.datasource.username}") private val datasourceUsername: String,
    @Value("\${spring.datasource.password}") private val datasourcePassword: String
) {
    data class DatabaseConnectionInfo(
            val host: String,
            val port: Int,
            val database: String,
            val username: String,
            val password: String
    )

    fun ensureModuleDatabaseReady(moduleId: String, databaseName: String?): Boolean {
        val normalizedDbName = databaseName?.trim().orEmpty()
        if (normalizedDbName.isBlank()) {
            return true
        }

        val connectionInfo = getConnectionInfo()
        if (connectionInfo == null) {
            println("Unsupported datasource URL for module DB bootstrap: $datasourceUrl")
            return false
        }

        val adminJdbcUrl =
                "jdbc:postgresql://${connectionInfo.host}:${connectionInfo.port}/${connectionInfo.database}"
        val escapedDbName = normalizedDbName.replace("\"", "\"\"")

        return try {
            DriverManager.getConnection(
                            adminJdbcUrl,
                            connectionInfo.username,
                            connectionInfo.password
                    )
                    .use { connection ->
                        connection.autoCommit = true
                        val exists =
                                connection
                                        .prepareStatement(
                                                "SELECT 1 FROM pg_database WHERE datname = ?"
                                        )
                                        .use { stmt ->
                                            stmt.setString(1, normalizedDbName)
                                            stmt.executeQuery().use { rs -> rs.next() }
                                        }

                        if (!exists) {
                            connection.createStatement().use { st ->
                                st.execute("CREATE DATABASE \"$escapedDbName\"")
                            }
                            println("Created module database '$normalizedDbName' for $moduleId")
                        } else {
                            println(
                                    "Module database '$normalizedDbName' already exists for $moduleId"
                            )
                        }
                    }
            true
        } catch (e: Exception) {
            println("Failed ensuring module DB '$normalizedDbName' for $moduleId: ${e.message}")
            false
        }
    }

    fun getConnectionInfo(): DatabaseConnectionInfo? {
        val jdbcBase = parseJdbcUrl(datasourceUrl) ?: return null
        return DatabaseConnectionInfo(
                host = jdbcBase.host,
                port = jdbcBase.port,
                database = jdbcBase.database,
                username = datasourceUsername,
                password = datasourcePassword
        )
    }

    private fun parseJdbcUrl(url: String): JdbcBase? {
        if (!url.startsWith("jdbc:postgresql://")) return null
        return try {
            val uri = URI(url.removePrefix("jdbc:"))
            val host = uri.host ?: return null
            val port = if (uri.port > 0) uri.port else 5432
            val database = uri.path.removePrefix("/").ifBlank { "postgres" }
            JdbcBase(host, port, database)
        } catch (_: Exception) {
            null
        }
    }

    private data class JdbcBase(val host: String, val port: Int, val database: String)
}
