package com.homelab.core.service.module
import com.fasterxml.jackson.databind.DeserializationFeature
import com.fasterxml.jackson.databind.ObjectMapper
import com.fasterxml.jackson.module.kotlin.registerKotlinModule
import com.homelab.core.model.Module
import com.homelab.core.model.ModuleConfig
import com.homelab.core.model.ModuleStatus
import com.homelab.core.model.ModuleType
import java.io.File
import org.springframework.stereotype.Service

@Service
class ModuleConfigService {
    private val mapper =
            ObjectMapper()
                    .registerKotlinModule()
                    .configure(DeserializationFeature.FAIL_ON_UNKNOWN_PROPERTIES, false)

    data class DiscoveredModule(val config: ModuleConfig, val directory: File)

    fun scanModuleConfigs(scanPath: String): List<DiscoveredModule> {
        val root = File(scanPath).canonicalFile
        val files = root.listFiles() ?: return emptyList()

        return files
                .asSequence()
                .filter { it.isDirectory }
                .mapNotNull { dir ->
                    val configFile = File(dir, "homelab-module.json")
                    if (!configFile.exists()) {
                        return@mapNotNull null
                    }

                    try {
                        DiscoveredModule(
                                config = mapper.readValue(configFile, ModuleConfig::class.java),
                                directory = dir
                        )
                    } catch (e: Exception) {
                        println("Failed to load module config in ${dir.name}: ${e.message}")
                        null
                    }
                }
                .toList()
    }

    fun loadModuleConfig(moduleDir: File?): ModuleConfig? {
        if (moduleDir == null) return null
        val configFile = File(moduleDir, "homelab-module.json")
        if (!configFile.exists()) return null

        return try {
            mapper.readValue(configFile, ModuleConfig::class.java)
        } catch (e: Exception) {
            println("Unable to read module config in ${moduleDir.name}: ${e.message}")
            null
        }
    }

    fun createModuleFromConfig(config: ModuleConfig): Module {
        return Module(
                id = config.id,
                name = config.name,
                port = config.port,
                internalUrl =
                        if (config.type == ModuleType.DOCKER) {
                            "http://${config.id}:${config.port}"
                        } else {
                            "http://localhost:${config.port}"
                        },
                status = ModuleStatus.INACTIVE,
                icon = config.icon,
                description = config.description,
                type = config.type
        )
    }
}
