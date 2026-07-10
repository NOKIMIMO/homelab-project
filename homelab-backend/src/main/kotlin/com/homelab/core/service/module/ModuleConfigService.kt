package com.homelab.core.service.module
import com.fasterxml.jackson.databind.DeserializationFeature
import com.fasterxml.jackson.databind.ObjectMapper
import com.fasterxml.jackson.module.kotlin.registerKotlinModule
import com.homelab.sdk.helper.AppLogger
import com.homelab.core.exception.BadRequestException
import com.homelab.core.model.module.Module
import com.homelab.core.model.module.ModuleConfig
import com.homelab.core.model.module.ModuleStatus
import com.homelab.core.plugin.PluginRegistry
import com.homelab.core.model.action.ActionsEnum
import java.io.File
import org.springframework.stereotype.Service
import com.vdurmont.semver4j.Semver

@Service
class ModuleConfigService(private val pluginRegistry: PluginRegistry) {
    private val log = AppLogger.loggerFor(ModuleConfigService::class)

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
            if (!File(dir, "manifest.json").exists()) continue

            try {
                val config = parseAndValidateManifest(dir, seenModuleIds)
                seenModuleIds.add(config.id)
                discovered.add(DiscoveredModule(config = config, directory = dir))
            } catch (e: Exception) {
                log.error("Failed to load module config in ${dir.name}: ${e.message}")
            }
        }

        return discovered
    }

    // Parses and validates a module's manifest.json, throwing BadRequestException on any
    // format problem. Used both by scanModuleConfigs (caught, logged, module skipped) and by
    // the zip-install flow (uncaught, surfaced to the caller as an HTTP 400).
    fun parseAndValidateManifest(dir: File, existingIds: Set<String>): ModuleConfig {
        val configFile = File(dir, "manifest.json")
        if (!configFile.exists()) {
            throw BadRequestException("No manifest.json found in '${dir.name}'")
        }

        val rawConfig = try {
            mapper.readValue(configFile, ModuleConfig::class.java)
        } catch (e: Exception) {
            throw BadRequestException("Malformed manifest.json in '${dir.name}': ${e.message}", e)
        }

        if (existingIds.contains(rawConfig.id)) {
            throw BadRequestException("Duplicate module id '${rawConfig.id}'")
        }

        val functionNames = rawConfig.actions
            .flatMap { it.functions }
            .map { it.name }

        if (functionNames.size != functionNames.toSet().size) {
            throw BadRequestException("Module '${rawConfig.id}' has duplicate function names")
        }

        val unknownLogic = rawConfig.actions
            .asSequence()
            .flatMap { it.functions.asSequence() }
            .flatMap { it.logic.asSequence() }
            .map { it.type }
            .firstOrNull { type ->
                val isBuiltin = runCatching { ActionsEnum.valueOf(type) }.isSuccess
                !isBuiltin && !pluginRegistry.hasType(type)
            }

        if (unknownLogic != null) {
            throw BadRequestException("Module '${rawConfig.id}' references unknown logic type '$unknownLogic'")
        }

        val incompatibleDep = rawConfig.dependencies
            ?.firstOrNull { dep -> !isCompatible(rawConfig.version, dep.version) }

        if (incompatibleDep != null) {
            throw BadRequestException(
                "Module '${rawConfig.id}' has incompatible dependency on module '${incompatibleDep.moduleId}' " +
                    "with version requirement '${incompatibleDep.version}'"
            )
        }

        return rawConfig
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

    private fun isCompatible(current: String, requirement: String): Boolean {
        val version = Semver(current, Semver.SemverType.NPM)
        return version.satisfies(requirement)
    }
}
