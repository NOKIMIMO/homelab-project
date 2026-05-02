package com.homelab.core.service

import io.jsonwebtoken.Jwts
import io.jsonwebtoken.security.Keys
import org.springframework.stereotype.Service
import java.util.*
import javax.crypto.SecretKey

@Service
class JwtService {
    // In a real application, this should be an environment variable
    private val secret = "a-very-long-and-secure-secret-key-that-is-at-least-256-bits-long"
    private val key: SecretKey = Keys.hmacShaKeyFor(secret.toByteArray())

    fun generateToken(username: String): String {
        val now = Date()
        val expiryDate = Date(now.time + 86400000) // 24 hours

        return Jwts.builder()
            .setSubject(username)
            .setIssuedAt(now)
            .setExpiration(expiryDate)
            .signWith(key)
            .compact()
    }

    fun validateToken(token: String): String? {
        return try {
            //TODO: check doc to not use deprecated stuff
            val claims = Jwts.parser()
                .setSigningKey(key)
                .build()
                .parseClaimsJws(token)
                .body

            if (claims.expiration.before(Date())) null
            else claims.subject
        } catch (_: Exception) {
            null
        }
    }
}
