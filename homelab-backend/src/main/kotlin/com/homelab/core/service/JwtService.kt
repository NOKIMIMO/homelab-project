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
            .subject(username)
            .issuedAt(now)
            .expiration(expiryDate)
            .signWith(key)
            .compact()
    }

    fun validateToken(token: String): String? {
        return try {
            val claims = Jwts.parser()
                .verifyWith(key)
                .build()
                .parseSignedClaims(token)
                .payload
            
            if (claims.expiration.before(Date())) null
            else claims.subject
        } catch (e: Exception) {
            null
        }
    }
}
