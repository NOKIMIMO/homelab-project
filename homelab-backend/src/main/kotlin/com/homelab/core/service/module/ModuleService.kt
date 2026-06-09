package com.homelab.core.service.module

import com.homelab.core.action.ActionFactory
import com.homelab.core.api.dto.ModuleDto
import com.homelab.core.config.HomelabConfig
import com.homelab.core.config.ModuleConfigMemory
import com.homelab.core.helper.AppLogger
import com.homelab.core.model.module.Module
import com.homelab.core.model.module.ModuleStatus
import com.homelab.core.parser.ModuleDataObjectParser
import com.homelab.core.service.AppletService
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
    private val moduleConfigMemory: ModuleConfigMemory
) {
    private val log = AppLogger.loggerFor(AppletService::class)

    private val modules = ConcurrentHashMap<String, Module>()
    private val moduleConfigs = ConcurrentHashMap<String, File>()

    @PostConstruct
    fun init() {
        scanModules()
    }

    @PreDestroy
    fun cleanup() {
        log.info("Shutting down: stopping all managed modules...")
        try {
            modules.values.forEach { module ->
                try {
                    module.stop()
                } catch (e: Exception) {
                    log.error("Failed to stop module ${module.id} during shutdown: ${e.message}")
                }
            }
            log.info("All modules stopped")

        } catch (e: Exception) {
            log.error("Failed to run global cleanup: ${e.message}")
        }
    }

    fun isModuleRunning(moduleId: String): Boolean {
        return modules[moduleId]?.status == ModuleStatus.ACTIVE
    }

    fun scanModules() {
        val root = File(homelabConfig.modulesScanPath).canonicalFile
        log.info("Scanning modules in ${root.absolutePath}")

        val discovered = moduleConfigService.scanModuleConfigs(homelabConfig.modulesScanPath)
        discovered.forEach { item ->
            moduleConfigMemory.put(
                item.config.id,
                item.config,
                item.directory
            )
            moduleConfigs[item.config.id] = item.directory
            if (modules[item.config.id] == null) {
                modules[item.config.id] = moduleConfigService.createModuleFromConfig(item.config)
            }
            // Validate icon file existence inside module directory; warn if missing
            try {
                val iconName = item.config.icon
                val iconFile = File(item.directory, iconName)
                if (!iconFile.exists() || !iconFile.isFile) {
                    log.warn("Declared icon '${iconName}' for module '${item.config.id}' not found at ${iconFile.absolutePath}")
                }
            } catch (_: Exception) {
                // ignore validation errors
            }
            // init DB for module if dataObject is not empty
            ensureModuleDatabaseReady(item.config.id)

            // init DB object from module config
            setUpModuleDataObject(item.config.id, item.config.dataObjects!!)

        }
    }

    fun getAvailableAction():List<String> {
        return actionFactory.getAvailableActionTypes()
    }

    // Expose icon as a URL instead of embedding the ResponseEntity resource in the DTO.
    // The controller exposes the icon at GET /api/modules/{id}/UI/icon so we return that path.
    fun getModules(): List<ModuleDto> {
        return modules.values.map { m ->
            val iconUrl = "/api/modules/${m.id}/UI/icon"
            ModuleDto(
                id = m.id,
                name = m.name,
                version = m.version,
                internalUrl = m.internalUrl,
                status = m.status,
                description = m.description,
                uptimeStart = m.uptimeStart,
                icon = iconUrl
            )
        }
    }

    fun getModule(id: String): Module? {
        val module = modules[id] ?: return null
        return module
    }

    fun getModuleUiDeclaration(id: String): Any? {
        val discovered = moduleConfigService.scanModuleConfigs(homelabConfig.modulesScanPath)
        val found = discovered.find { it.config.id == id } ?: return null
        return mapOf(
            "pages" to found.config.page
        )
    }

    fun getModulePage(id: String, page: String): String? {
        val discovered = moduleConfigService.scanModuleConfigs(homelabConfig.modulesScanPath)
        val found = discovered.find { it.config.id == id } ?: return null
        val file = File(found.directory, page)
        if (!file.exists() || !file.isFile) return null
        return try {
            file.readText()
        } catch (e: Exception) {
            log.error("Failed to read module page ${file.absolutePath}: ${e.message}",e)
            null
        }
    }

    fun getModulePage(id: String): String? {
        val discovered = moduleConfigService.scanModuleConfigs(homelabConfig.modulesScanPath)
        val found = discovered.find { it.config.id == id } ?: return null

        if (found.config.page == null){
            log.warn("Module ${id} has no page declared, skipping page content retrieval")
            return null // API only
        }

        val file = File(found.directory, found.config.page)
        log.debug("Attempting to read module page for module '${id}' from file: ${file.absolutePath}")
        if (!file.exists() || !file.isFile) return null
        return try {
            file.readText()
        } catch (e: Exception) {
            log.error("Failed to read module page ${file.absolutePath}: ${e.message}", e)
            null
        }
    }

    fun getModuleIcon(id: String): ResponseEntity<Resource> {
        val module = modules[id]
            ?: return ResponseEntity.notFound().build()
        // If the icon is an absolute URL, redirect the client to it
        log.debug("Serving module icon for module '${id}' with declared icon path '${module.icon}'")
        try {
            if (module.icon.startsWith("http://") || module.icon.startsWith("https://")) {
                return ResponseEntity.status(org.springframework.http.HttpStatus.FOUND)
                    .location(java.net.URI.create(module.icon))
                    .build()
            }

            val file = File(homelabConfig.modulesScanPath, "$id/${module.icon}")

            if (file.exists() && file.isFile) {
                val resource: Resource = FileSystemResource(file)
                val contentType = Files.probeContentType(file.toPath())
                    ?: MediaType.APPLICATION_OCTET_STREAM_VALUE
                return ResponseEntity.ok()
                    .header("Cache-Control", "max-age=3600, public")
                    .header("Content-Disposition", "inline; filename=\"${file.name}\"")
                    .contentLength(file.length())
                    .contentType(MediaType.parseMediaType(contentType))
                    .body(resource)
            }

            return ResponseEntity.notFound().build()

        } catch (e: Exception) {
            log.error("Failed to serve module icon for module '${id}': ${e.message}", e)
            return ResponseEntity.status(org.springframework.http.HttpStatus.INTERNAL_SERVER_ERROR).build()
        }
    }



    fun startModule(id: String): Boolean {
        val module = modules[id] ?: return false
        log.info("Starting module $id")
        module.start()
        return true
    }

    fun stopModule(id: String): Boolean {
        val module = modules[id] ?: return false
        log.info("Stopping module $id")
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
            // Data object creation
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
                val objectDefinition = ModuleDataObjectParser.parseFromXml(xml, moduleId)
                moduleDatabaseService.setUpModuleDataObject(
                    moduleId,
                    objectDefinition
                )
            }
            // Data object relation (separated to let full spung up of original table before relation)
            for (fileName in xmlFileName) {
                val file = File(
                    homelabConfig.modulesScanPath,
                    "$moduleId/$fileName"
                ).canonicalFile
                if (!file.exists()) {
                    error("Data object XML not found: ${file.absolutePath}")
                }
                val xml = file.readText()

                moduleDatabaseService.setUpModuleDataObjectRelations(
                    moduleId,
                    ModuleDataObjectParser.parseFromXml(xml, moduleId)
                )
            }


        }catch (e: Exception){
            log.error("Failed to set up data objects for module $moduleId: ${e.message}", e)
            return false
        }
        return true
    }

}
