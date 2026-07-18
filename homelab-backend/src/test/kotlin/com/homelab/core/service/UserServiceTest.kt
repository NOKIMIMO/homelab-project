package com.homelab.core.service

import com.homelab.core.exception.NotFoundException
import com.homelab.core.model.auth.Role
import com.homelab.core.model.auth.RoleRepository
import com.homelab.core.model.auth.User
import com.homelab.core.model.auth.UserRepository
import org.junit.jupiter.api.Assertions.assertEquals
import org.junit.jupiter.api.Assertions.assertFalse
import org.junit.jupiter.api.Assertions.assertThrows
import org.junit.jupiter.api.Assertions.assertTrue
import org.junit.jupiter.api.BeforeEach
import org.junit.jupiter.api.Test
import org.mockito.ArgumentMatchers.any
import org.mockito.ArgumentMatchers.anyLong
import org.mockito.Mockito.mock
import org.mockito.Mockito.never
import org.mockito.Mockito.verify
import org.mockito.Mockito.`when`
import java.util.Optional

class UserServiceTest {

    private lateinit var userRepository: UserRepository
    private lateinit var roleRepository: RoleRepository
    private lateinit var service: UserService

    @BeforeEach
    fun setUp() {
        userRepository = mock(UserRepository::class.java)
        roleRepository = mock(RoleRepository::class.java)
        service = UserService(userRepository, roleRepository)
        `when`(userRepository.save(any(User::class.java))).thenAnswer { it.arguments[0] }
    }

    @Test
    fun `registerUser rejects a user with neither a public key nor a password`() {
        `when`(userRepository.findByEmail("a@example.com")).thenReturn(Optional.empty())

        assertThrows(IllegalArgumentException::class.java) {
            service.registerUser(name = "A", email = "a@example.com", publicKeyPem = null, passwordHash = null)
        }
    }

    @Test
    fun `registerUser rejects an email that is already taken`() {
        `when`(userRepository.findByEmail("a@example.com")).thenReturn(Optional.of(User(email = "a@example.com")))

        assertThrows(IllegalArgumentException::class.java) {
            service.registerUser(name = "A", email = "a@example.com", publicKeyPem = null, passwordHash = "hash")
        }
    }

    @Test
    fun `registerUser saves a new user with resolved roles`() {
        `when`(userRepository.findByEmail("a@example.com")).thenReturn(Optional.empty())
        val role = Role(name = "Family")
        `when`(roleRepository.findAllById(setOf(1L))).thenReturn(listOf(role))

        val user = service.registerUser(
            name = "A", email = "a@example.com", publicKeyPem = null, passwordHash = "hash", roleIds = setOf(1L)
        )

        assertEquals("a@example.com", user.email)
        assertEquals(setOf(role), user.roles)
    }

    @Test
    fun `transferAdmin promotes the target demotes the source and grants the Moderator role`() {
        val from = User(email = "admin@example.com", isAdmin = true)
        val to = User(email = "user@example.com", isAdmin = false)
        `when`(userRepository.findById(1L)).thenReturn(Optional.of(from))
        `when`(userRepository.findById(2L)).thenReturn(Optional.of(to))
        `when`(roleRepository.findByNameIgnoreCase("Moderator")).thenReturn(null)
        `when`(roleRepository.save(any(Role::class.java))).thenAnswer { it.arguments[0] }

        service.transferAdmin(1L, 2L)

        assertTrue(to.isAdmin)
        assertFalse(from.isAdmin)
        assertTrue(from.roles.any { it.name == "Moderator" })
        verify(userRepository).save(from)
        verify(userRepository).save(to)
    }

    @Test
    fun `transferAdmin reuses an existing Moderator role instead of creating a duplicate`() {
        val moderator = Role(name = "Moderator")
        val from = User(email = "admin@example.com", isAdmin = true)
        val to = User(email = "user@example.com", isAdmin = false)
        `when`(userRepository.findById(1L)).thenReturn(Optional.of(from))
        `when`(userRepository.findById(2L)).thenReturn(Optional.of(to))
        `when`(roleRepository.findByNameIgnoreCase("Moderator")).thenReturn(moderator)

        service.transferAdmin(1L, 2L)

        verify(roleRepository, never()).save(any(Role::class.java))
        assertTrue(from.roles.contains(moderator))
    }

    @Test
    fun `transferAdmin rejects a source user that is not currently an admin`() {
        val from = User(email = "user@example.com", isAdmin = false)
        val to = User(email = "user2@example.com", isAdmin = false)
        `when`(userRepository.findById(1L)).thenReturn(Optional.of(from))
        `when`(userRepository.findById(2L)).thenReturn(Optional.of(to))

        assertThrows(IllegalArgumentException::class.java) { service.transferAdmin(1L, 2L) }
    }

    @Test
    fun `deleteUser refuses to delete the administrator`() {
        val admin = User(email = "admin@example.com", isAdmin = true)
        `when`(userRepository.findById(1L)).thenReturn(Optional.of(admin))

        assertThrows(IllegalArgumentException::class.java) { service.deleteUser(1L) }
        verify(userRepository, never()).deleteById(anyLong())
    }

    @Test
    fun `deleteUser removes a non-admin user`() {
        val user = User(email = "user@example.com", isAdmin = false)
        `when`(userRepository.findById(1L)).thenReturn(Optional.of(user))

        service.deleteUser(1L)

        verify(userRepository).deleteById(1L)
    }

    @Test
    fun `updateUserRoles refuses to change the administrator's roles`() {
        val admin = User(email = "admin@example.com", isAdmin = true)
        `when`(userRepository.findById(1L)).thenReturn(Optional.of(admin))

        assertThrows(IllegalArgumentException::class.java) { service.updateUserRoles(1L, setOf(2L)) }
        verify(userRepository, never()).save(any(User::class.java))
    }

    @Test
    fun `updateUserPermissions throws NotFoundException for a missing user`() {
        `when`(userRepository.findById(99L)).thenReturn(Optional.empty())

        assertThrows(NotFoundException::class.java) { service.updateUserPermissions(99L, setOf("read:photos")) }
    }

    @Test
    fun `updateUserPermissions refuses to change the administrator's permissions`() {
        val admin = User(email = "admin@example.com", isAdmin = true)
        `when`(userRepository.findById(1L)).thenReturn(Optional.of(admin))

        assertThrows(IllegalArgumentException::class.java) { service.updateUserPermissions(1L, setOf("read:photos")) }
        verify(userRepository, never()).save(any(User::class.java))
    }

    @Test
    fun `issueTemporaryPassword sets mustResetPassword and returns a matching plaintext password`() {
        val user = User(email = "user@example.com")
        `when`(userRepository.findById(1L)).thenReturn(Optional.of(user))

        val tempPassword = service.issueTemporaryPassword(1L)

        assertTrue(Regex("^[A-Z0-9]{4}(-[A-Z0-9]{4}){2}$").matches(tempPassword), "unexpected format: $tempPassword")
        assertTrue(user.mustResetPassword)
        assertTrue(AuthService.matchesPassword(user.passwordHash, tempPassword))
    }

    @Test
    fun `updatePassword clears mustResetPassword and stores the new hash`() {
        val user = User(email = "user@example.com", mustResetPassword = true)
        `when`(userRepository.findById(1L)).thenReturn(Optional.of(user))

        service.updatePassword(1L, "new-hash")

        assertEquals("new-hash", user.passwordHash)
        assertFalse(user.mustResetPassword)
    }
}
