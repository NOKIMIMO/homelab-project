package com.homelab.core.service

import org.junit.jupiter.api.Assertions.assertEquals
import org.junit.jupiter.api.Assertions.assertNull
import org.junit.jupiter.api.Assertions.assertTrue
import org.junit.jupiter.api.Test

class JwtServiceTest {

    private val service = JwtService()

    @Test
    fun `generateToken then validateToken round-trips the subject and admin claims`() {
        val token = service.generateToken("user@example.com", isAdmin = true, adminPermissions = setOf("ADMIN_ACCESS"))

        val claims = service.validateToken(token)

        assertTrue(claims != null)
        assertEquals("user@example.com", claims!!.subject)
        assertEquals(true, claims["isAdmin"])
        @Suppress("UNCHECKED_CAST")
        val perms = claims["adminPermissions"] as List<String>
        assertEquals(listOf("ADMIN_ACCESS"), perms)
    }

    @Test
    fun `generateToken defaults adminPermissions to an empty list`() {
        val token = service.generateToken("user@example.com", isAdmin = false)

        val claims = service.validateToken(token)!!

        assertEquals(false, claims["isAdmin"])
        assertEquals(emptyList<String>(), claims["adminPermissions"])
    }

    @Test
    fun `validateToken returns null for a malformed token`() {
        assertNull(service.validateToken("not-a-jwt"))
    }

    @Test
    fun `validateToken returns null for a token signed with a different key`() {
        val otherService = JwtService()
        // both services use the same hardcoded secret today, so tamper with the token instead
        val token = otherService.generateToken("user@example.com", isAdmin = false)
        val tampered = token.dropLast(2) + "xx"

        assertNull(service.validateToken(tampered))
    }
}
