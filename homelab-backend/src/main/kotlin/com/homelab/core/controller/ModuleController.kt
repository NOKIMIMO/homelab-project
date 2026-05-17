package com.homelab.core.controller

import com.homelab.core.service.module.ModuleService
import org.springframework.web.bind.annotation.*

@RestController
@RequestMapping("/api/modules")
@CrossOrigin(origins = ["*"])
class ModuleController(private val moduleService: ModuleService) {

    @GetMapping
    fun getModules() = moduleService.getModules()

    @GetMapping("/{id}")
    fun getModule(@PathVariable id: String) = moduleService.getModule(id)

    @GetMapping("/{id}/UI")
    fun getModuleUiDeclaration(@PathVariable id: String) = moduleService.getModuleUiDeclaration(id)

    @GetMapping("/{id}/UI/{page}")
    fun getModulePage(@PathVariable id: String, @PathVariable page: String) = moduleService.getModulePage(id, page)

    @GetMapping("/{id}/UI/router")
    fun getModuleRouter(@PathVariable id: String) = moduleService.getModuleRouter(id)

    @GetMapping("/{id}/UI/icon")
    fun getModuleIcon(@PathVariable id: String) = moduleService.getModuleIcon(id)

    @PostMapping("/{id}/start")
    fun startModule(@PathVariable id: String) = mapOf("success" to moduleService.startModule(id))

    @PostMapping("/{id}/stop")
    fun stopModule(@PathVariable id: String) = mapOf("success" to moduleService.stopModule(id))

    @PostMapping("/{id}/install")
    fun installModule(@PathVariable id: String) = mapOf("success" to moduleService.installModule(id))

    //TODO: keep? not using docker anymore so....
    @GetMapping("/{id}/health")
    fun healthCheck(@PathVariable id: String) = mapOf("status" to if (moduleService.healthCheck(id)) "UP" else "DOWN")

    @PostMapping("/scan")
    fun scanModules() = moduleService.scanModules()
}
