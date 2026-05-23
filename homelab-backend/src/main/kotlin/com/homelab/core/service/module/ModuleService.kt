package com.homelab.core.service.module

import com.homelab.core.action.ActionFactory
import com.homelab.core.config.HomelabConfig
import com.homelab.core.model.module.Module
import com.homelab.core.model.module.ModuleStatus
import com.homelab.core.parser.ModuleDataObjectParser
import jakarta.annotation.*
import org.springframework.core.io.Resource
import org.springframework.core.io.FileSystemResource
import org.springframework.http.MediaType
import org.springframework.http.ResponseEntity
import java.io.File
import java.util.concurrent.ConcurrentHashMap
import org.springframework.stereotype.Service
import java.nio.file.Files

@Service
class ModuleService(
    private val homelabConfig: HomelabConfig,
    private val moduleDatabaseService: ModuleDatabaseService,
    private val moduleConfigService: ModuleConfigService,
    private val actionFactory: ActionFactory,
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

    fun isModuleRunning(moduleId: String): Boolean {
        return modules[moduleId]?.status == ModuleStatus.ACTIVE
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
            // init DB for module if dataObject is not empty
            println("Initializing module database for ${item.config.id}")
            ensureModuleDatabaseReady(item.config.id)

            // init DB object from module config
            println("Initializing module data objects for ${item.config.id}")
            setUpModuleDataObject(item.config.id, item.config.dataObjects!!)

        }
        println("Modules loaded: ${modules.size}")
        println(modules)
    }

    fun getAvailableAction():List<String> {
        return actionFactory.getAvailableActionTypes()
    }

    fun getModules(): List<Module> {
        return modules.values.toList()
    }

    fun getModule(id: String): Module? {
        val module = modules[id] ?: return null
        return module
    }

    fun getModuleUiDeclaration(id: String): Any? {
        val discovered = moduleConfigService.scanModuleConfigs(homelabConfig.modulesScanPath)
        val found = discovered.find { it.config.id == id } ?: return null
        return mapOf(
            "router" to found.config.router,
            "pages" to (found.config.pages ?: emptyList())
        )
    }

    fun getModuleRouter(id: String): Any? {
        val discovered = moduleConfigService.scanModuleConfigs(homelabConfig.modulesScanPath)
        val found = discovered.find { it.config.id == id } ?: return null
        val routerName = found.config.router ?: return null
        val file = File(found.directory, routerName)
        if (!file.exists() || !file.isFile) return null
        return try {
            file.readText()
        } catch (e: Exception) {
            println("Failed to read router ${file.absolutePath}: ${e.message}")
            null
        }
    }

    fun getModulePage(id: String, page: String): String? {
        val discovered = moduleConfigService.scanModuleConfigs(homelabConfig.modulesScanPath)
        val found = discovered.find { it.config.id == id } ?: return null
        val file = File(found.directory, page)
        if (!file.exists() || !file.isFile) return null
        return try {
            file.readText()
        } catch (e: Exception) {
            println("Failed to read module page ${file.absolutePath}: ${e.message}")
            null
        }
    }

    fun getModuleIcon(id: String): ResponseEntity<Resource> {
        val module = modules[id]
            ?: return ResponseEntity.notFound().build()

        val file = File(homelabConfig.modulesScanPath, "$id/${module.icon}")

        if (!file.exists() || !file.isFile) {
            return ResponseEntity.notFound().build()
        }

        val resource: Resource = FileSystemResource(file)

        val contentType = Files.probeContentType(file.toPath())
            ?: MediaType.APPLICATION_OCTET_STREAM_VALUE

        return ResponseEntity.ok()
            .contentType(MediaType.parseMediaType(contentType))
            .body(resource)
    }



    fun startModule(id: String): Boolean {
        val module = modules[id] ?: return false
        println("Starting module $id")
        module.start()
        return true
    }

    fun stopModule(id: String): Boolean {
        val module = modules[id] ?: return false
        println("Stopping module $id")
        module.stop()
        return true
    }

    //TODO:
    // Think  about the way to go with this one
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
        // return true if module is running + it's database is ready
        val module = modules[id] ?: return false
        if (module.status == ModuleStatus.ACTIVE) {
            return ensureModuleDatabaseReady(id)
        }
        return false
    }

    private fun ensureModuleDatabaseReady(moduleId: String): Boolean {
        return moduleDatabaseService.ensureModuleDatabaseReady(
                moduleId,
        )
    }
    private fun setUpModuleDataObject(moduleId: String, xmlFileName: List<String> ): Boolean {

        try {
            for (fileName in xmlFileName) {
                val file = File(
                    homelabConfig.modulesScanPath,
                    "$moduleId/$fileName"
                ).canonicalFile
//                println("Scanning module ${file.absolutePath} for dataObject")
                if (!file.exists()) {
                    error("Data object XML not found: ${file.absolutePath}")
                }
                val xml = file.readText()

                moduleDatabaseService.setUpModuleDataObject(
                    moduleId,
                    ModuleDataObjectParser.parseFromXml(xml)
                )
            }
        }catch (e: Exception){
            println("Failed to set up data objects for module $moduleId: ${e.message}")
            return false
        }
        return true
    }

}
