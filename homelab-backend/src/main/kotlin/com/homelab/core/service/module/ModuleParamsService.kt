package com.homelab.core.service.module

import com.fasterxml.jackson.module.kotlin.jacksonObjectMapper
import com.fasterxml.jackson.module.kotlin.readValue
import com.homelab.core.config.ModuleConfigMemory
import com.homelab.sdk.helper.AppLogger
import com.homelab.sdk.module.param.ModuleParamDeclaration
import com.homelab.sdk.module.param.ModuleParamsConfig
import org.springframework.stereotype.Service
import java.io.File

@Service
class ModuleParamsService(private val moduleConfigMemory: ModuleConfigMemory) {

    private val log = AppLogger.loggerFor(this::class)

    private val mapper = jacksonObjectMapper()
    private val PARAMS_FILE = "params.json"
    private val VALUES_FILE = "params.values.json"

    fun hasParams(moduleId: String): Boolean {
        val dir = moduleConfigMemory.getDirectory(moduleId) ?: return false
        return File(dir, PARAMS_FILE).exists()
    }

    fun getDeclarations(moduleId: String): List<ModuleParamDeclaration> {
        val dir = moduleConfigMemory.getDirectory(moduleId) ?: return emptyList()
        val file = File(dir, PARAMS_FILE)
        if (!file.exists()) return emptyList()
        return try {
            mapper.readValue<ModuleParamsConfig>(file).parameters
        } catch (_: Exception) {
            emptyList()
        }
    }

    // Returns values with secret fields masked as null
    fun getValues(moduleId: String): Map<String, String?> {
        log.debug("Getting values for moduleId: $moduleId")
        val dir = moduleConfigMemory.getDirectory(moduleId) ?: return emptyMap()
        val declarations = getDeclarations(moduleId)
        val stored = readStoredValues(dir)
        return declarations.associate { param ->
            val raw = stored[param.key] ?: param.defaultValue.ifEmpty { null }
            val masked = if (param.type == "secret" && raw != null) "***" else raw
            param.key to masked
        }
    }

    // Returns values unmasked --- for internal/module use only
    fun getRawValues(moduleId: String): Map<String, String?> {
        val dir = moduleConfigMemory.getDirectory(moduleId) ?: return emptyMap()
        val declarations = getDeclarations(moduleId)
        val stored = readStoredValues(dir)
        return declarations.associate { param ->
            param.key to (stored[param.key] ?: param.defaultValue.ifEmpty { null })
        }
    }

    // Full replacement of stored values
    fun setValues(moduleId: String, incoming: Map<String, String>) {
        val dir = moduleConfigMemory.getDirectory(moduleId) ?: return
        val declarations = getDeclarations(moduleId)
        val allowedKeys = declarations.map { it.key }.toSet()
        val filtered = incoming.filterKeys { it in allowedKeys }
        val existing = readStoredValues(dir).toMutableMap()
        existing.putAll(filtered)
        mapper.writeValue(File(dir, VALUES_FILE), existing)
    }

    private fun readStoredValues(dir: File): Map<String, String> {
        log.debug("Reading stored values from $dir")
        val file = File(dir, VALUES_FILE)
        if (!file.exists()) return emptyMap()
        return try {
            mapper.readValue(file)
        } catch (_: Exception) {
            emptyMap()
        }
    }
}
