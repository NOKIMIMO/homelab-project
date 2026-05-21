package com.homelab.core.service.module
import com.fasterxml.jackson.databind.DeserializationFeature
import com.fasterxml.jackson.databind.ObjectMapper
import com.fasterxml.jackson.module.kotlin.registerKotlinModule
import com.homelab.core.model.module.Module
import com.homelab.core.model.module.ModuleConfig
import com.homelab.core.model.module.ModuleStatus
import com.homelab.core.model.module.ModuleType
import com.homelab.core.plugin.PluginRegistry
import com.homelab.core.model.action.ActionsEnum
import java.io.File
import org.springframework.stereotype.Service

@Service
class ModuleConfigService(private val pluginRegistry: PluginRegistry) {
    private val mapper =
            ObjectMapper()
                    .registerKotlinModule()
                    .configure(DeserializationFeature.FAIL_ON_UNKNOWN_PROPERTIES, false)

    data class DiscoveredModule(val config: ModuleConfig, val directory: File)

    fun scanModuleConfigs(scanPath: String): List<DiscoveredModule> {
        pluginRegistry.ensureLoaded()
        val root = File(scanPath).canonicalFile
        val files = root.listFiles() ?: return emptyList()
        val discovered = mutableListOf<DiscoveredModule>()
        val seenModuleIds = mutableSetOf<String>()

        for (dir in files) {
            if (!dir.isDirectory) continue
            val configFile = File(dir, "manifest.json")
            if (!configFile.exists()) continue

            try {
                val rawConfig = mapper.readValue(configFile, ModuleConfig::class.java)

                if (seenModuleIds.contains(rawConfig.id)) {
                    println("Duplicate module id '${rawConfig.id}' found in directory '${dir.name}'. Skipping this module.")
                    continue
                }

                // check duplicate function names inside this module
                val functionNames = rawConfig.actions.flatMap { it.functions.map { f -> f.name } }
                if (functionNames.toSet().size != functionNames.size) {
                    println("Module '${rawConfig.id}' has duplicate function names in manifest ${configFile.absolutePath}. Skipping module.")
                    continue
                }

                // Validate logic types (must be in ActionsEnum or provided by plugin)
                var unknownLogic: String? = null
                outer@ for (action in rawConfig.actions) {
                    for (f in action.functions) {
                        for (logic in f.logic) {
                            val t = logic.type
                            val isBuiltin = try {
                                ActionsEnum.valueOf(t)
                                true
                            } catch (_: Exception) {
                                false
                            }
                            if (!isBuiltin && !pluginRegistry.hasType(t)) {
                                unknownLogic = t
                                break@outer
                            }
                        }
                    }
                }
                if (unknownLogic != null) {
                    println("Module '${rawConfig.id}' references unknown logic type '$unknownLogic' in ${configFile.absolutePath}. Skipping module.")
                    continue
                }

                seenModuleIds.add(rawConfig.id)
                discovered.add(DiscoveredModule(config = rawConfig, directory = dir))

            } catch (e: Exception) {
                println("Failed to load module config in ${dir.name}: ${e.message}")
            }
        }

        return discovered
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
