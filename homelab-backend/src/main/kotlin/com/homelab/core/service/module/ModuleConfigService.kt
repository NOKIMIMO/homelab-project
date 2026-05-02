package com.homelab.core.service.module
import com.fasterxml.jackson.databind.DeserializationFeature
import com.fasterxml.jackson.databind.ObjectMapper
import com.fasterxml.jackson.module.kotlin.registerKotlinModule
import com.homelab.core.model.module.Module
import com.homelab.core.model.module.ModuleConfig
import com.homelab.core.model.module.ModuleStatus
import com.homelab.core.model.module.ModuleType
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
                    val configFile = File(dir, "manifest.json")
                    if (!configFile.exists()) {
                        return@mapNotNull null
                    }

                    try {
                        val rawConfig = mapper.readValue(configFile, ModuleConfig::class.java)

                        // Filter duplicated function names across all actions: keep first occurrence, log duplicates
                        // TODO
                        // will deal with this later, when i have the brain for it
                        val seenFunctions = mutableSetOf<String>()
                        val filteredActions = rawConfig.actions.map { action ->
                            val filteredFunctions = action.functions.filter { f ->
                                val already = seenFunctions.contains(f.name)
                                if (!already) {
                                    seenFunctions.add(f.name)
                                    true
                                } else {
                                    println("Duplicate function name '${f.name}' found in module '${rawConfig.id}' (directory=${dir.name}). Ignoring duplicate.")
                                    false
                                }
                            }
                            action.copy(functions = filteredFunctions)
                        }

                        val config = rawConfig.copy(actions = filteredActions)

                        DiscoveredModule(
                                config = config,
                                directory = dir
                        )
                    } catch (e: Exception) {
                        println("Failed to load module config in ${dir.name}: ${e.message}")
                        null
                    }
                }
                .toList()
    }

    fun createModuleFromConfig(config: ModuleConfig): Module {
        return Module(
                id = config.id,
                name = config.name,
                version = config.version,
                internalUrl = config.id,
                status = ModuleStatus.INACTIVE,
                icon = config.icon,
                description = config.description,
        )
    }
}
