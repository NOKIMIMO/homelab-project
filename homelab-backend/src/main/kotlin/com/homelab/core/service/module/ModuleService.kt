package com.homelab.core.service.module

import com.homelab.core.config.HomelabConfig
import com.homelab.core.model.*
import jakarta.annotation.*
import java.io.File
import java.net.*
import java.util.concurrent.ConcurrentHashMap
import org.springframework.stereotype.Service

@Service
class ModuleService(
    private val homelabConfig: HomelabConfig,
    private val moduleDockerService: ModuleDockerService,
    private val moduleDatabaseService: ModuleDatabaseService,
    private val moduleConfigService: ModuleConfigService,
    private val moduleNativeService: ModuleNativeService
) {
    private val modules = ConcurrentHashMap<String, Module>()
    private val moduleConfigs = ConcurrentHashMap<String, File>()

    @PostConstruct
    fun init() {
        scanModules()
    }

    @PreDestroy
    fun cleanup() {
        println("Shutting down: stopping all managed modules...")
        try {
            moduleNativeService.cleanupProcesses()
            moduleDockerService.stopManagedContainers()
            println("Cleanup finished")
        } catch (e: Exception) {
            println("Failed to run global cleanup: ${e.message}")
        }
    }

    fun scanModules() {
        val root = File(homelabConfig.modulesScanPath).canonicalFile
        println("Scanning modules in ${root.absolutePath}")

        val discovered = moduleConfigService.scanModuleConfigs(homelabConfig.modulesScanPath)
        discovered.forEach { item ->
            moduleConfigs[item.config.id] = item.directory
            if (modules[item.config.id] == null) {
                modules[item.config.id] = moduleConfigService.createModuleFromConfig(item.config)
            }
        }
        println("Modules loaded: ${modules.size}")
        println(modules)
    }

    fun getModules(): List<Module> {
        modules.values.forEach { updateModuleStatus(it) }
        return modules.values.toList()
    }

    private fun updateModuleStatus(module: Module) {
        if (module.type == ModuleType.DOCKER) {
            val isRunning = isContainerRunning(module.id)
            if (isRunning) {
                if (module.status != ModuleStatus.ACTIVE) {
                    module.status = ModuleStatus.ACTIVE
                    module.uptimeStart = System.currentTimeMillis() // Approximate
                }
            } else {
                module.status = ModuleStatus.INACTIVE
                module.uptimeStart = null
            }
            return
        }

        moduleNativeService.updateModuleStatus(module)
    }

    private fun isContainerRunning(containerName: String): Boolean {
        // TODO: Need to check module type for this one, keep docker fo now 
        return moduleDockerService.isContainerRunning(
                containerName,
                moduleConfigs[containerName],
                homelabConfig.appRoot
        )
    }

    fun getModule(id: String): Module? {
        val module = modules[id] ?: return null
        updateModuleStatus(module)
        return module
    }

    fun startModuleDev(id: String): Boolean {
        val module = modules[id] ?: return false
        println("Starting module $id in development mode")

        val devModeEnabled =
                (System.getenv("HOMELAB_ENABLE_DEV_MODE") ?: "false")
                        .equals("true", ignoreCase = true)

        if (!devModeEnabled) {
            println("Development mode is disabled. Set HOMELAB_ENABLE_DEV_MODE=true to enable.")
            return false
        }

        if (!ensureModuleDatabaseReady(id)) {
            println("Module $id database is not ready. Aborting dev start.")
            return false
        }

        if (module.type == ModuleType.DOCKER) {
            return moduleDockerService.startManagedModuleDev(
                    module = module,
                    moduleDir = moduleConfigs[id],
                    appRoot = homelabConfig.appRoot,
                    moduleDbName = loadModuleConfig(id)?.databaseName
            )
        }

        val dir = moduleConfigs[id] ?: return false
        val config = loadModuleConfig(id) ?: return false
        val command = config.developmentCommand ?: config.startCommand ?: return false
        val success = moduleNativeService.startModule(module, dir, command)
        if (success) {
            println("Module $id started in development mode")
        }
        return success
    }

    fun startModule(id: String): Boolean {
        val module = modules[id] ?: return false
        println("Starting module $id")

        if (!ensureModuleDatabaseReady(id)) {
            println("Module $id database is not ready. Aborting start.")
            return false
        }

        if (module.type == ModuleType.DOCKER) {
            return moduleDockerService.startManagedModule(
                    module = module,
                    moduleDir = moduleConfigs[id],
                    appRoot = homelabConfig.appRoot,
                    moduleDbName = loadModuleConfig(id)?.databaseName
            )
        }
        println("Starting module $id as native application")
        val dir = moduleConfigs[id] ?: return false
        val config = loadModuleConfig(id) ?: return false
        println("Config: $config")
        val command = config.startCommand ?: return false
        println("Start Command: $command")
        println("Starting module $id as native application")
        val success = moduleNativeService.startModule(module, dir, command)
        if (success) {
            println("Module $id started successfully")
        }
        return success
    }

    fun stopModule(id: String): Boolean {
        val module = modules[id] ?: return false

        if (module.type == ModuleType.DOCKER) {
            return try {
                module.status = ModuleStatus.STOPPING
                val moduleDir = moduleConfigs[id]
                val success = moduleDockerService.stopModule(id, moduleDir, homelabConfig.appRoot)
                if (success) {
                    module.status = ModuleStatus.INACTIVE
                    module.uptimeStart = null
                    true
                } else {
                    false
                }
            } catch (e: Exception) {
                false
            }
        }

        return moduleNativeService.stopModule(module)
    }

    fun installModule(id: String): Boolean {
        val module = modules[id] ?: return false
        if (module.type == ModuleType.DOCKER)
                return true // Docker modules don't need "install" this way

        val dir = moduleConfigs[id] ?: return false
        val config = loadModuleConfig(id) ?: return false
        val command = config.installCommand ?: return false
        return moduleNativeService.installModule(module, dir, command)
    }

    fun healthCheck(id: String): Boolean {
        val module = modules[id] ?: return false
        if (module.status != ModuleStatus.ACTIVE) return false

        if (module.type == ModuleType.DOCKER) {
            return isContainerRunning(module.id)
        }

        return try {
            val connection = URL(module.internalUrl).openConnection() as HttpURLConnection
            connection.connectTimeout = 2000
            connection.readTimeout = 2000
            connection.requestMethod = "GET"
            connection.responseCode in 200..399
        } catch (e: Exception) {
            false
        }
    }

    private fun ensureModuleDatabaseReady(moduleId: String): Boolean {
        return moduleDatabaseService.ensureModuleDatabaseReady(
                moduleId,
                loadModuleConfig(moduleId)?.databaseName
        )
    }

    private fun loadModuleConfig(moduleId: String): ModuleConfig? {
        return moduleConfigService.loadModuleConfig(moduleConfigs[moduleId])
    }

}
