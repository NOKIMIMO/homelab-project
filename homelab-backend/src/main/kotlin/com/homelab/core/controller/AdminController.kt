package com.homelab.core.controller

import com.homelab.core.config.HomelabConfig
import com.homelab.sdk.helper.AppLogger
import org.springframework.http.ResponseEntity
import org.springframework.web.bind.annotation.*

@RestController
@RequestMapping("/api/admin")
@CrossOrigin(origins = ["*"])
class AdminController(
    private val homelabConfig: HomelabConfig
) {

    @GetMapping("/logs")
    fun getLogs(
        @RequestParam(required = false) level: String?,
        @RequestParam(required = false, defaultValue = "300") limit: Int
    ): List<AppLogger.LogEntry> {
        val logs = AppLogger.getLogs()
        return (if (level != null) logs.filter { it.level == level } else logs)
            .takeLast(limit)
    }

    @DeleteMapping("/logs")
    fun clearLogs(): Map<String, Any> {
        AppLogger.clearLogs()
        return mapOf("success" to true)
    }

    @GetMapping("/config")
    fun getConfig(): Map<String, Any> = mapOf(
        "appRoot" to homelabConfig.appRoot,
        "modulesScanPath" to homelabConfig.modulesScanPath,
        "pluginsScanPath" to homelabConfig.pluginsScanPath,
        "logLevel" to AppLogger.getLevel().name
    )

    @PutMapping("/config/log-level")
    fun setLogLevel(@RequestBody body: Map<String, String>): ResponseEntity<Map<String, Any>> {
        val levelStr = body["level"]
            ?: return ResponseEntity.badRequest().body(mapOf("success" to false, "message" to "Missing 'level' field"))
        return try {
            val newLevel = AppLogger.Level.valueOf(levelStr)
            AppLogger.setLevel(newLevel)
            ResponseEntity.ok(mapOf("success" to true, "level" to newLevel.name))
        } catch (_: IllegalArgumentException) {
            ResponseEntity.badRequest().body(mapOf("success" to false, "message" to "Invalid log level: $levelStr"))
        }
    }
}
