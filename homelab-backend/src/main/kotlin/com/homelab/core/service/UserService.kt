package com.homelab.core.service

import com.homelab.core.exception.NotFoundException
import com.homelab.core.model.auth.AdminPermission
import com.homelab.core.model.auth.Role
import com.homelab.core.model.auth.User
import com.homelab.core.model.auth.UserRepository
import com.homelab.core.model.auth.RoleRepository
import org.springframework.stereotype.Service
import java.security.SecureRandom

@Service
class UserService(
    private val repository: UserRepository,
    private val roleRepository: RoleRepository,
) {

    companion object {
        // Same alphabet as RecoveryCodeService: excludes ambiguous characters (0/O, 1/I/L, etc).
        private const val TEMP_PASSWORD_ALPHABET = "ABCDEFGHJKMNPQRSTUVWXYZ23456789"

        // Role handed to an admin who transfers away their admin status (see transferAdmin):
        // keeps every administration permission so they don't lose all capability, without
        // holding the isAdmin flag itself.
        private const val MODERATOR_ROLE_NAME = "Moderator"
    }

    private val secureRandom = SecureRandom()

    fun getAllUsers(): List<User> = repository.findAll()

    fun registerUser(
        name: String?,
        email: String,
        publicKeyPem: String?,
        isAdmin: Boolean = false,
        passwordHash: String?,
        roleIds: Set<Long> = emptySet(),
    ): com.homelab.core.model.auth.User {
        if (publicKeyPem.isNullOrBlank() && passwordHash.isNullOrBlank()) {
            throw IllegalArgumentException("Either publicKey or password must be provided")
        }

        if (repository.findByEmail(email).isPresent) {
            throw IllegalArgumentException("User with this email already exists")
        }

        val roles: MutableSet<com.homelab.core.model.auth.Role> =
            if (roleIds.isEmpty()) mutableSetOf() else roleRepository.findAllById(roleIds).toMutableSet()
        val user = User(name = name, email = email, publicKey = publicKeyPem, isAdmin = isAdmin, passwordHash = passwordHash, roles = roles)
        return repository.save(user)
    }

    // The administrator can never be deleted directly - they must transfer the admin role first
    // (see transferAdmin). This is also what stops an ADMIN_ACCESS holder from ejecting the admin.
    fun deleteUser(id: Long) {
        val user = repository.findById(id).orElseThrow { NotFoundException("User with id $id not found") }
        if (user.isAdmin) throw IllegalArgumentException("The administrator cannot be deleted; transfer the admin role first")
        repository.deleteById(id)
    }

    fun deleteAllUsers() = repository.deleteAll()

    // Hands full admin status to [toId] and demotes [fromId] to a "Moderator" role that keeps
    // every AdminPermission, so the outgoing admin doesn't lose all capability. The caller's
    // existing JWT still carries the old isAdmin claim until they log in again - the frontend
    // forces a re-login right after a successful transfer to pick up the new role/permissions.
    fun transferAdmin(fromId: Long, toId: Long) {
        val from = repository.findById(fromId).orElseThrow { NotFoundException("User with id $fromId not found") }
        val to = repository.findById(toId).orElseThrow { NotFoundException("User with id $toId not found") }
        if (!from.isAdmin) throw IllegalArgumentException("Only an administrator can transfer their role")

        to.isAdmin = true
        from.isAdmin = false
        from.roles.add(moderatorRole())
        repository.save(to)
        repository.save(from)
    }

    private fun moderatorRole(): Role =
        roleRepository.findByNameIgnoreCase(MODERATOR_ROLE_NAME) ?: roleRepository.save(
            Role(name = MODERATOR_ROLE_NAME, adminPermissions = AdminPermission.entries.mapTo(mutableSetOf()) { it.name })
        )

    fun findByEmail(email: String): User? = repository.findByEmail(email).orElse(null)

    // The administrator's own account is off-limits, mirroring updateUserRoles: an ADMIN_ACCESS
    // holder must not be able to overwrite the administrator's direct per-module permissions either.
    fun updateUserPermissions(id: Long, permissions: Set<String>) {
        val user = repository.findById(id).orElseThrow { NotFoundException("User with id $id not found") }
        if (user.isAdmin) throw IllegalArgumentException("The administrator's permissions cannot be changed")
        user.permissions = permissions.toMutableSet()
        repository.save(user)
    }

    // The administrator's own roles are off-limits: this is the "change the admin's roles"
    // operation an ADMIN_ACCESS holder must not be able to perform (the admin manages their own
    // account via transferAdmin instead).
    fun updateUserRoles(id: Long, roleIds: Set<Long>) {
        val user = repository.findById(id).orElseThrow { NotFoundException("User with id $id not found") }
        if (user.isAdmin) throw IllegalArgumentException("The administrator's roles cannot be changed")
        user.roles = roleRepository.findAllById(roleIds).toMutableSet()
        repository.save(user)
    }

    // Generates a one-time temporary password for a user whose reset request was approved.
    // Returned in plaintext once; only its hash is persisted. mustResetPassword forces the
    // next successful login to invalidate it immediately (see AuthController.login).
    fun issueTemporaryPassword(id: Long): String {
        val user = repository.findById(id).orElseThrow { NotFoundException("User with id $id not found") }
        val tempPassword = (1..3).joinToString("-") {
            (1..4).map { TEMP_PASSWORD_ALPHABET[secureRandom.nextInt(TEMP_PASSWORD_ALPHABET.length)] }.joinToString("")
        }
        user.passwordHash = AuthService.encodePassword(tempPassword)
        user.mustResetPassword = true
        repository.save(user)
        return tempPassword
    }

    fun updatePassword(id: Long, newPasswordHash: String) {
        val user = repository.findById(id).orElseThrow { NotFoundException("User with id $id not found") }
        user.passwordHash = newPasswordHash
        user.mustResetPassword = false
        repository.save(user)
    }

}