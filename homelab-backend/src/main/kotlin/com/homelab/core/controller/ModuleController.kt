package com.homelab.core.controller

import com.homelab.core.service.module.ModuleService
import com.homelab.core.service.module.ModuleParamsService
import org.springframework.http.MediaType
import org.springframework.http.ResponseEntity
import org.springframework.security.access.prepost.PreAuthorize
import org.springframework.web.bind.annotation.*
import org.springframework.web.multipart.MultipartFile
import jakarta.servlet.http.HttpServletRequest
import org.springframework.core.io.Resource
import org.springframework.web.servlet.support.ServletUriComponentsBuilder

@RestController
@RequestMapping("/api/modules")
@CrossOrigin(origins = ["*"])
class ModuleController(
    private val moduleService: ModuleService,
    private val moduleParamsService: ModuleParamsService
) {

    //TODO: move in it's service
    @GetMapping
    fun getModules(request: HttpServletRequest) =
        moduleService.getModules().map { dto ->

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

    @PostMapping("/scan")
    fun scanModules() = moduleService.scanModules()

    @GetMapping("/actions")
    fun getAvailableActions() = moduleService.getAvailableAction()

    @GetMapping("/{id}")
    fun getModule(@PathVariable id: String) = moduleService.getModule(id)

    @GetMapping("/{id}/UI")
    fun getModuleUiDeclaration(@PathVariable id: String) = moduleService.getModuleUiDeclaration(id)

    @GetMapping("/{id}/UI/page")
    fun getModulePage(@PathVariable id: String) = moduleService.getModulePage(id)

//    @GetMapping("/{id}/UI/router")
//    fun getModuleRouter(@PathVariable id: String) = moduleService.getModuleRouter(id)

    @GetMapping("/{id}/UI/icon")
    fun getModuleIcon(@PathVariable id: String) = moduleService.getModuleIcon(id)

//    @GetMapping("/{id}/UI/{page}")
//    fun getModulePage(@PathVariable id: String, @PathVariable page: String) = moduleService.getModulePage(id, page)

//    @GetMapping("/{id}/UI/assets/{fileName:.+}")
    @GetMapping("/{id}/UI/**")
fun getModuleAsset(
        @PathVariable id: String,
        request: HttpServletRequest
    ): ResponseEntity<Resource> {
        return moduleService.getModuleAsset(id, request)
    }

    @PostMapping("/{id}/start")
    @PreAuthorize("hasRole('ADMIN') or @permissionService.currentUserHasAdminPermission('ADMIN_ACCESS')")
    fun startModule(@PathVariable id: String) = mapOf("success" to moduleService.startModule(id))

    @PostMapping("/{id}/stop")
    @PreAuthorize("hasRole('ADMIN') or @permissionService.currentUserHasAdminPermission('ADMIN_ACCESS')")
    fun stopModule(@PathVariable id: String) = mapOf("success" to moduleService.stopModule(id))

    @PostMapping("/{id}/install")
    @PreAuthorize("hasRole('ADMIN') or @permissionService.currentUserHasAdminPermission('ADMIN_ACCESS')")
    fun installModule(@PathVariable id: String) = mapOf("success" to moduleService.installModule(id))

    @PostMapping("/install", consumes = [MediaType.MULTIPART_FORM_DATA_VALUE])
    @PreAuthorize("hasRole('ADMIN') or @permissionService.currentUserHasAdminPermission('ADMIN_ACCESS')")
    fun installModuleZip(@RequestPart("file") file: MultipartFile) = moduleService.installModuleZip(file)

    //TODO: keep? not using docker anymore so....
    @GetMapping("/{id}/health")
    fun healthCheck(@PathVariable id: String) = mapOf("status" to if (moduleService.healthCheck(id)) "UP" else "DOWN")

    @GetMapping("/{id}/params")
    fun getParams(@PathVariable id: String): ResponseEntity<Map<String, Any>> {
        if (!moduleParamsService.hasParams(id)) return ResponseEntity.notFound().build()
        val body = mapOf(
            "moduleId" to id,
            "declarations" to moduleParamsService.getDeclarations(id),
            "values" to moduleParamsService.getValues(id)
        )
        return ResponseEntity.ok(body)
    }

    @PutMapping("/{id}/params")
    fun setParams(
        @PathVariable id: String,
        @RequestBody values: Map<String, String>
    ): ResponseEntity<Map<String, Any>> {
        if (!moduleParamsService.hasParams(id)) return ResponseEntity.notFound().build()
        moduleParamsService.setValues(id, values)
        val body = mapOf(
            "moduleId" to id,
            "declarations" to moduleParamsService.getDeclarations(id),
            "values" to moduleParamsService.getValues(id)
        )
        return ResponseEntity.ok(body)
    }
}
