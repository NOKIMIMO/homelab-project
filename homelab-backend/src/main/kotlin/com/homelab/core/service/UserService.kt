package com.homelab.core.service

import com.homelab.core.model.auth.User
import com.homelab.core.model.auth.UserRepository
import org.springframework.stereotype.Service

@Service
class UserService(private val repository: UserRepository) {

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

}