package com.homelab.core.controller

import com.homelab.core.service.module.ModuleService
import org.springframework.web.bind.annotation.*
import jakarta.servlet.http.HttpServletRequest
import org.springframework.web.servlet.support.ServletUriComponentsBuilder

@RestController
@RequestMapping("/api/modules")
@CrossOrigin(origins = ["*"])
class ModuleController(private val moduleService: ModuleService) {

    //TODO: move in it's service
    @GetMapping
    fun getModules(request: HttpServletRequest) =
        moduleService.getModules().map { dto ->
            println(dto)
            val absoluteIcon = dto.icon?.let { rel ->
                if (rel.startsWith("http")) return@let rel
                try {
                    ServletUriComponentsBuilder.fromRequest(request)
                        .replacePath(rel)
                        .build()
                        .toUriString()
                } catch (_: Exception) {
                    val scheme = request.scheme
                    val host = request.serverName
                    val port = request.serverPort
                    val portPart = if ((scheme == "http" && port == 80) || (scheme == "https" && port == 443)) "" else ":$port"
                    "$scheme://$host$portPart$rel"
                }
            }
            dto.copy(icon = absoluteIcon)
        }

    @GetMapping("/{id}")
    fun getModule(@PathVariable id: String) = moduleService.getModule(id)

    @GetMapping("/{id}/UI")
    fun getModuleUiDeclaration(@PathVariable id: String) = moduleService.getModuleUiDeclaration(id)

    @GetMapping("/{id}/UI/{page}")
    fun getModulePage(@PathVariable id: String, @PathVariable page: String) = moduleService.getModulePage(id, page)

    @GetMapping("/{id}/UI/page")
    fun getModulePage(@PathVariable id: String) = moduleService.getModulePage(id)

//    @GetMapping("/{id}/UI/router")
//    fun getModuleRouter(@PathVariable id: String) = moduleService.getModuleRouter(id)

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

    @GetMapping("/actions")
    fun getAvailableActions() = moduleService.getAvailableAction()
}
