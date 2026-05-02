package com.homelab.core.service.module

import com.homelab.core.config.HomelabConfig
import com.homelab.core.model.module.Module
import com.homelab.core.model.module.ModuleConfig
import com.homelab.core.model.module.ModuleStatus
import com.homelab.core.model.module.ModuleType
import jakarta.annotation.*
import java.io.File
import java.net.*
import java.util.concurrent.ConcurrentHashMap
import org.springframework.stereotype.Service

@Service
class ModuleService(
    private val homelabConfig: HomelabConfig,
//    private val moduleDatabaseService: ModuleDatabaseService, // will use later, used to give modules a database + acces to it
    private val moduleConfigService: ModuleConfigService,
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
//        moduleNativeService.updateModuleStatus(module)
    }

    fun getModule(id: String): Module? {
        val module = modules[id] ?: return null
        updateModuleStatus(module)
        return module
    }


    fun startModule(id: String): Boolean {
        val module = modules[id] ?: return false
        println("Starting module $id")

        if (!ensureModuleDatabaseReady(id)) {
            println("Module $id database is not ready. Aborting start.")
            return false
        }
        // Flow :
        // 1. check if module is already running
        // 1.1 if yes, return true
        // 2. Get Module config
        // 2.1 if data model present, check that DB/Schema is available
        // 2.1.1 if not, create it
        // 2.2 check that dataObject as a table in DB/Schema and follows the model
        // 3 Update module status to active
        // 4 Allow routing to it's functions path in route


//        if (module.type == ModuleType.DOCKER) {
//            return moduleDockerService.startManagedModule(
//                    module = module,
//                    moduleDir = moduleConfigs[id],
//                    appRoot = homelabConfig.appRoot,
//                    moduleDbName = loadModuleConfig(id)?.databaseName
//            )
//        }
//        println("Starting module $id as native application")
//        val dir = moduleConfigs[id] ?: return false
//        val config = loadModuleConfig(id) ?: return false
//        println("Config: $config")
//        val command = config.startCommand ?: return false
//        println("Start Command: $command")
//        println("Starting module $id as native application")
//        val success = moduleNativeService.startModule(module, dir, command)
//        if (success) {
//            println("Module $id started successfully")
//        }
//        return success
        return false
    }

    fun stopModule(id: String): Boolean {
        val module = modules[id] ?: return false

//        if (module.type == ModuleType.DOCKER) {
//            return try {
//                module.status = ModuleStatus.STOPPING
//                val moduleDir = moduleConfigs[id]
//                val success = moduleDockerService.stopModule(id, moduleDir, homelabConfig.appRoot)
//                if (success) {
//                    module.status = ModuleStatus.INACTIVE
//                    module.uptimeStart = null
//                    true
//                } else {
//                    false
//                }
//            } catch (e: Exception) {
//                false
//            }
//        }

//        return moduleNativeService.stopModule(module)
        return false
    }

    fun installModule(id: String): Boolean {
//        val module = modules[id] ?: return false
//        if (module.type == ModuleType.DOCKER)
//                return true // Docker modules don't need "install" this way
//
//        val dir = moduleConfigs[id] ?: return false
//        val config = loadModuleConfig(id) ?: return false
//        val command = config.installCommand ?: return false
//        return moduleNativeService.installModule(module, dir, command)
        return true
    }

    fun healthCheck(id: String): Boolean {
//        val module = modules[id] ?: return false
//        if (module.status != ModuleStatus.ACTIVE) return false
//
//        if (module.type == ModuleType.DOCKER) {
//            return isContainerRunning(module.id)
//        }
//
//        return try {
//            val connection = URL(module.internalUrl).openConnection() as HttpURLConnection
//            connection.connectTimeout = 2000
//            connection.readTimeout = 2000
//            connection.requestMethod = "GET"
//            connection.responseCode in 200..399
//        } catch (e: Exception) {
//            false
//        }
        return false
    }

    private fun ensureModuleDatabaseReady(moduleId: String): Boolean {
//        return moduleDatabaseService.ensureModuleDatabaseReady(
//                moduleId,
//                loadModuleConfig(moduleId)?.databaseName
//        )
        return true
    }

}
