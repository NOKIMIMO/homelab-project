package com.homelab.core.controller

import com.homelab.core.api.dto.RoleRequest
import com.homelab.core.api.dto.toDto
import com.homelab.core.service.RoleService
import org.springframework.http.ResponseEntity
import org.springframework.security.access.prepost.PreAuthorize
import org.springframework.web.bind.annotation.*

@RestController
@RequestMapping("/api/admin/roles")
@PreAuthorize("hasRole('ADMIN')")
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
