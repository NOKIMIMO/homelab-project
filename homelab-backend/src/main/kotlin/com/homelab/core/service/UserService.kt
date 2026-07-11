package com.homelab.core.service

import com.homelab.core.exception.NotFoundException
import com.homelab.core.model.auth.User
import com.homelab.core.model.auth.UserRepository
import org.springframework.stereotype.Service
import java.security.SecureRandom

@Service
class UserService(private val repository: UserRepository) {

    companion object {
        // Same alphabet as RecoveryCodeService: excludes ambiguous characters (0/O, 1/I/L, etc).
        private const val TEMP_PASSWORD_ALPHABET = "ABCDEFGHJKMNPQRSTUVWXYZ23456789"
    }

    private val secureRandom = SecureRandom()

    fun getAllUsers(): List<User> = repository.findAll()

    fun registerUser(name: String?, email: String, publicKeyPem: String?, isAdmin: Boolean = false, passwordHash: String?): com.homelab.core.model.auth.User {
        if (publicKeyPem.isNullOrBlank() && passwordHash.isNullOrBlank()) {
            throw IllegalArgumentException("Either publicKey or password must be provided")
        }

        if (repository.findByEmail(email).isPresent) {
            throw IllegalArgumentException("User with this email already exists")
        }

        val user = User(name = name, email = email, publicKey = publicKeyPem, isAdmin = isAdmin, passwordHash = passwordHash)
        return repository.save(user)
    }

    fun deleteUser(id: Long) = repository.deleteById(id)

    fun deleteAllUsers() = repository.deleteAll()

    fun updateUserAdmin(id: Long, isAdmin: Boolean) {
        val user = repository.findById(id).orElseThrow { IllegalArgumentException("User with id $id not found") }
        if (user.isAdmin == isAdmin) return
        user.isAdmin = isAdmin
        repository.save(user)
    }

    fun findByEmail(email: String): User? = repository.findByEmail(email).orElse(null)

    fun updateUserPermissions(id: Long, permissions: Set<String>) {
        val user = repository.findById(id).orElseThrow { NotFoundException("User with id $id not found") }
        user.permissions = permissions.toMutableSet()
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