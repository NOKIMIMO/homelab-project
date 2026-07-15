package com.homelab.core.controller

import com.homelab.core.api.dto.RoleRequest
import com.homelab.core.api.dto.toDto
import com.homelab.core.service.RoleService
import org.springframework.http.ResponseEntity
import org.springframework.security.access.prepost.PreAuthorize
import org.springframework.web.bind.annotation.*

@RestController
@RequestMapping("/api/admin/roles")
// Full admins always pass; otherwise the caller must hold the MANAGE_ROLES administration
// permission via one of their roles (see PermissionService.currentUserHasAdminPermission).
// This does not grant the ability to change a user's isAdmin flag - granting isAdmin only ever
// happens via AdminController.transferAdmin, matching "changer les rôles, sauf de l'administrateur".
@PreAuthorize("hasRole('ADMIN') or @permissionService.currentUserHasAdminPermission('MANAGE_ROLES')")
@CrossOrigin(origins = ["*"])
class RoleController(private val roleService: RoleService) {

    @GetMapping
    fun listRoles() = roleService.listRoles().map { it.toDto() }

    @PostMapping
    fun createRole(@RequestBody req: RoleRequest) = roleService.createRole(req).toDto()

    @PutMapping("/{id}")
    fun updateRole(@PathVariable id: Long, @RequestBody req: RoleRequest) = roleService.updateRole(id, req).toDto()

    @DeleteMapping("/{id}")
    fun deleteRole(@PathVariable id: Long): ResponseEntity<Void> {
        roleService.deleteRole(id)
        return ResponseEntity.ok().build()
    }
}
