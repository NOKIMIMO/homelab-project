package com.homelab.core.controller

import com.homelab.core.config.ModuleConfigMemory
import com.homelab.core.exception.ForbiddenException
import com.homelab.core.service.PermissionService
import com.homelab.core.service.UserService
import com.homelab.core.service.module.ModuleService
import com.homelab.core.service.module.ModuleParamsService
import org.springframework.http.MediaType
import org.springframework.http.ResponseEntity
import org.springframework.security.access.prepost.PreAuthorize
import org.springframework.security.core.context.SecurityContextHolder
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
    private val moduleParamsService: ModuleParamsService,
    private val permissionService: PermissionService,
    private val userService: UserService,
    private val moduleConfigMemory: ModuleConfigMemory
) {

    //TODO: move in it's service
    // Only list modules the caller may currently reach: a module they have no access to - or one
    // whose granting role is inside a blocked time window right now - is left out entirely so it
    // never shows up in their sidebar or dashboard.
    @GetMapping
    fun getModules(request: HttpServletRequest) =
        moduleService.getModules()
            .filter { dto -> canSee(dto.id) }
            .map { dto ->

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

    // A module is visible when the authenticated caller may currently access it. If we can't
    // resolve the config (nothing declared) or the user, fall back to the config's own rule:
    // a module with no declared permissions stays open, matching the default access behavior.
    private fun canSee(moduleId: String): Boolean {
        val config = moduleConfigMemory.getConfig(moduleId) ?: return true
        val email = SecurityContextHolder.getContext().authentication?.name ?: return config.permissions.isEmpty()
        val user = userService.findByEmail(email) ?: return config.permissions.isEmpty()
        return permissionService.canAccessModule(user, config)
    }

    // Guard the endpoints that serve a single module's content: reaching /plugins/{id} directly (or
    // hitting these routes by hand) must fail with 403 for a module the caller cannot currently
    // access - including one hidden right now by a role's time block - not just be missing from the list.
    private fun requireAccess(moduleId: String) {
        if (!canSee(moduleId)) throw ForbiddenException("No access to module $moduleId")
    }

    @PostMapping("/scan")
    fun scanModules() = moduleService.scanModules()

    @GetMapping("/actions")
    fun getAvailableActions() = moduleService.getAvailableAction()

    @GetMapping("/{id}")
    fun getModule(@PathVariable id: String) = requireAccess(id).let { moduleService.getModule(id) }

    @GetMapping("/{id}/UI")
    fun getModuleUiDeclaration(@PathVariable id: String) = requireAccess(id).let { moduleService.getModuleUiDeclaration(id) }

    @GetMapping("/{id}/UI/page")
    fun getModulePage(@PathVariable id: String) = requireAccess(id).let { moduleService.getModulePage(id) }

//    @GetMapping("/{id}/UI/router")
//    fun getModuleRouter(@PathVariable id: String) = moduleService.getModuleRouter(id)

    @GetMapping("/{id}/UI/icon")
    fun getModuleIcon(@PathVariable id: String) = requireAccess(id).let { moduleService.getModuleIcon(id) }

//    @GetMapping("/{id}/UI/{page}")
//    fun getModulePage(@PathVariable id: String, @PathVariable page: String) = moduleService.getModulePage(id, page)

//    @GetMapping("/{id}/UI/assets/{fileName:.+}")
    @GetMapping("/{id}/UI/**")
fun getModuleAsset(
        @PathVariable id: String,
        request: HttpServletRequest
    ): ResponseEntity<Resource> {
        requireAccess(id)
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

    @GetMapping("/{id}/export")
    @PreAuthorize("hasRole('ADMIN') or @permissionService.currentUserHasAdminPermission('ADMIN_ACCESS')")
    fun exportModule(@PathVariable id: String): ResponseEntity<Resource> {
        val zip = moduleService.exportModuleZip(id)
        return ResponseEntity.ok()
            .contentType(MediaType.parseMediaType("application/zip"))
            .header("Content-Disposition", "attachment; filename=\"$id.zip\"")
            .body(zip)
    }

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
