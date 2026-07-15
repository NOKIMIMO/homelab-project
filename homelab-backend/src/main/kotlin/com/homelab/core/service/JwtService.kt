package com.homelab.core.service

import io.jsonwebtoken.Claims
import io.jsonwebtoken.Jwts
import io.jsonwebtoken.security.Keys
import org.springframework.stereotype.Service
import java.util.*
import javax.crypto.SecretKey

@Service
class JwtService {
    // In a real application, this should be an environment variable
    private val secret =
        "a-very-long-and-secure-secret-key-that-is-at-least-256-bits-long"

    private val key: SecretKey =
        Keys.hmacShaKeyFor(secret.toByteArray())

    // adminPermissions is a UI-gating hint only (decoded client-side, like isAdmin) - every
    // request is still re-authorized server-side from the live DB state
    // (see JwtAuthenticationFilter, PermissionService.currentUserHasAdminPermission), so a
    // stale token here can under- but never over-grant access.
    fun generateToken(username: String, isAdmin: Boolean, adminPermissions: Set<String> = emptySet()): String {
        val now = Date()
        val expiryDate = Date(now.time + 86400000) // 24h

        return Jwts.builder()
            .setSubject(username)
            .claim("isAdmin", isAdmin)
            .claim("adminPermissions", adminPermissions.toList())
            .setIssuedAt(now)
            .setExpiration(expiryDate)
            .signWith(key)
            .compact()
    }

    fun validateToken(token: String): Claims? {
        return try {
            Jwts.parser()
                .setSigningKey(key)
                .build()
                .parseClaimsJws(token)
                .body
        } catch (_: Exception) {
            null
        }
    }
}
