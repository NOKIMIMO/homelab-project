package com.homelab.core.service

import com.homelab.core.api.dto.BlockedWindowDto
import com.homelab.core.api.dto.RoleRequest
import com.homelab.core.exception.BadRequestException
import com.homelab.core.exception.NotFoundException
import com.homelab.core.model.auth.Role
import com.homelab.core.model.auth.RoleRepository
import com.homelab.core.model.auth.User
import com.homelab.core.model.auth.UserRepository
import org.junit.jupiter.api.Assertions.assertEquals
import org.junit.jupiter.api.Assertions.assertThrows
import org.junit.jupiter.api.Assertions.assertTrue
import org.junit.jupiter.api.BeforeEach
import org.junit.jupiter.api.Test
import org.mockito.ArgumentCaptor
import org.mockito.Mockito.mock
import org.mockito.Mockito.never
import org.mockito.Mockito.verify
import org.mockito.Mockito.`when`
import java.time.DayOfWeek
import java.time.LocalTime
import java.util.Optional

class RoleServiceTest {

    private lateinit var roleRepository: RoleRepository
    private lateinit var userRepository: UserRepository
    private lateinit var service: RoleService

    @BeforeEach
    fun setUp() {
        roleRepository = mock(RoleRepository::class.java)
        userRepository = mock(UserRepository::class.java)
        service = RoleService(roleRepository, userRepository)
    }

    @Test
    fun `createRole trims the name deduplicates windows per day and validates admin permissions`() {
        val request = RoleRequest(
            name = "  Family  ",
            moduleIds = listOf("photos", "weather"),
            blockedWindows = listOf(
                BlockedWindowDto(DayOfWeek.MONDAY, LocalTime.of(20, 0), LocalTime.of(7, 0)),
                BlockedWindowDto(DayOfWeek.MONDAY, LocalTime.of(21, 0), LocalTime.of(6, 0))
            ),
            adminPermissions = listOf("ADMIN_ACCESS")
        )
        `when`(roleRepository.existsByNameIgnoreCase("Family")).thenReturn(false)
        val savedCaptor = ArgumentCaptor.forClass(Role::class.java)
        `when`(roleRepository.save(savedCaptor.capture())).thenAnswer { it.arguments[0] }

        val result = service.createRole(request)

        assertEquals("Family", result.name)
        assertEquals(setOf("photos", "weather"), result.moduleIds)
        assertEquals(1, result.blockedWindows.size)
        assertEquals(LocalTime.of(21, 0), result.blockedWindows.first().start)
        assertEquals(setOf("ADMIN_ACCESS"), result.adminPermissions)
    }

    @Test
    fun `createRole rejects a blank name`() {
        val request = RoleRequest(name = "   ")

        assertThrows(BadRequestException::class.java) { service.createRole(request) }
    }

    @Test
    fun `createRole rejects a name that already exists`() {
        `when`(roleRepository.existsByNameIgnoreCase("Family")).thenReturn(true)

        assertThrows(BadRequestException::class.java) { service.createRole(RoleRequest(name = "Family")) }
    }

    @Test
    fun `createRole rejects an unknown admin permission`() {
        `when`(roleRepository.existsByNameIgnoreCase("Family")).thenReturn(false)

        assertThrows(BadRequestException::class.java) {
            service.createRole(RoleRequest(name = "Family", adminPermissions = listOf("NOT_REAL")))
        }
    }

    @Test
    fun `updateRole rejects a rename that collides with a different role`() {
        val existing = Role(name = "Family")
        `when`(roleRepository.findById(1L)).thenReturn(Optional.of(existing))
        val clash = mock(Role::class.java)
        `when`(clash.id).thenReturn(2L)
        `when`(roleRepository.findByNameIgnoreCase("Other")).thenReturn(clash)

        assertThrows(BadRequestException::class.java) {
            service.updateRole(1L, RoleRequest(name = "Other"))
        }
    }

    @Test
    fun `updateRole throws NotFoundException for a missing role`() {
        `when`(roleRepository.findById(99L)).thenReturn(Optional.empty())

        assertThrows(NotFoundException::class.java) {
            service.updateRole(99L, RoleRequest(name = "Anything"))
        }
    }

    @Test
    fun `deleteRole detaches the role from every user that holds it before deleting`() {
        val role = Role(id = 1L, name = "Family")
        `when`(roleRepository.findById(1L)).thenReturn(Optional.of(role))
        val userWithRole = User(email = "a@example.com", roles = mutableSetOf(role))
        val userWithoutRole = User(email = "b@example.com")
        `when`(userRepository.findAll()).thenReturn(listOf(userWithRole, userWithoutRole))

        service.deleteRole(1L)

        assertTrue(userWithRole.roles.isEmpty())
        verify(userRepository).save(userWithRole)
        verify(userRepository, never()).save(userWithoutRole)
        verify(roleRepository).delete(role)
    }

    @Test
    fun `deleteRole throws NotFoundException for a missing role`() {
        `when`(roleRepository.findById(42L)).thenReturn(Optional.empty())

        assertThrows(NotFoundException::class.java) { service.deleteRole(42L) }
    }
}
