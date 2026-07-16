package com.homelab.core.service

import com.homelab.core.api.dto.RoleRequest
import com.homelab.core.exception.BadRequestException
import com.homelab.core.exception.NotFoundException
import com.homelab.core.model.auth.AdminPermission
import com.homelab.core.model.auth.BlockedWindow
import com.homelab.core.model.auth.Role
import com.homelab.core.model.auth.RoleRepository
import com.homelab.core.model.auth.UserRepository
import java.time.LocalDateTime
import org.springframework.stereotype.Service
import org.springframework.transaction.annotation.Transactional

@Service
class RoleService(
    private val roleRepository: RoleRepository,
    private val userRepository: UserRepository,
) {

    fun listRoles(): List<Role> = roleRepository.findAll()

    fun createRole(req: RoleRequest): Role {
        val name = req.validatedName()
        if (roleRepository.existsByNameIgnoreCase(name)) {
            throw BadRequestException("A role named \"$name\" already exists")
        }
        return roleRepository.save(
            Role(
                name = name,
                moduleIds = req.moduleIds.toMutableSet(),
                blockedWindows = req.toWindows(),
                adminPermissions = req.validatedAdminPermissions(),
            )
        )
    }

    fun updateRole(id: Long, req: RoleRequest): Role {
        val role = roleRepository.findById(id).orElseThrow { NotFoundException("Role not found: $id") }
        val name = req.validatedName()
        val clash = roleRepository.findByNameIgnoreCase(name)
        if (clash != null && clash.id != id) {
            throw BadRequestException("A role named \"$name\" already exists")
        }
        role.name = name
        role.moduleIds = req.moduleIds.toMutableSet()
        role.blockedWindows = req.toWindows()
        role.adminPermissions = req.validatedAdminPermissions()
        role.updatedAt = LocalDateTime.now()
        return roleRepository.save(role)
    }

    // Detaches the role from every user (owning side of the user_roles join) before deleting it,
    // so the delete doesn't fail on the foreign key.
    @Transactional
    fun deleteRole(id: Long) {
        val role = roleRepository.findById(id).orElseThrow { NotFoundException("Role not found: $id") }
        userRepository.findAll().forEach { user ->
            if (user.roles.removeIf { it.id == id }) userRepository.save(user)
        }
        roleRepository.delete(role)
    }

    private fun RoleRequest.validatedName(): String =
        name.trim().ifBlank { throw BadRequestException("Role name is required") }

    private fun RoleRequest.validatedAdminPermissions(): MutableSet<String> =
        adminPermissions.map {
            AdminPermission.fromNameOrNull(it) ?: throw BadRequestException("Unknown admin permission: $it")
        }.mapTo(mutableSetOf()) { it.name }

    // Keep at most one window per day of week (last wins), matching how isBlockedAt resolves them.
    private fun RoleRequest.toWindows(): MutableList<BlockedWindow> =
        blockedWindows
            .associateBy { it.dayOfWeek }
            .values
            .map { BlockedWindow(it.dayOfWeek, it.start, it.end) }
            .toMutableList()
}
