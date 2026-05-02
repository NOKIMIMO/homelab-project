package com.homelab.core.controller

import com.homelab.core.model.AuthorizedKey
import com.homelab.core.model.AuthorizedKeyRepository
import com.homelab.core.service.AuthService
import com.homelab.core.service.JwtService
import jakarta.servlet.http.HttpServletResponse
import org.springframework.http.ResponseEntity
import org.springframework.web.bind.annotation.*

@RestController
@RequestMapping("/api/auth")
@CrossOrigin(origins = ["*"])
class AuthController(
        private val authService: AuthService,
        private val repository: AuthorizedKeyRepository,
        private val jwtService: JwtService
) {
    @GetMapping("/challenge")
    fun getChallenge(): ResponseEntity<Map<String, String>> {
        return ResponseEntity.ok(mapOf("challenge" to authService.generateChallenge()))
    }

    @PostMapping("/login")
    fun login(
            @RequestBody request: LoginRequest,
            response: HttpServletResponse
    ): ResponseEntity<Map<String, Any>> {
        val keys = repository.findAll()
        var matchedKey: AuthorizedKey? = null

        for (key in keys) {
            if (authService.verifySignature(key.publicKey, request.signature, request.challenge)) {
                matchedKey = key
                break
            }
        }

        return if (matchedKey != null) {
            val token = jwtService.generateToken(matchedKey.name)

            println("Setting homelab_token cookie for ${matchedKey.name}")
            val cookie = jakarta.servlet.http.Cookie("homelab_token", token)
            cookie.isHttpOnly = true
            cookie.path = "/"
            cookie.maxAge = 86400 // 24h
            response.addCookie(cookie)

            ResponseEntity.ok(
                    mapOf("success" to true, "token" to token, "keyName" to matchedKey.name)
            )
        } else {
            ResponseEntity.status(401)
                    .body(mapOf("success" to false, "message" to "Invalid signature"))
        }
    }

    @GetMapping("/keys") fun getKeys(): List<AuthorizedKey> = authService.getAllKeys()

    @PostMapping("/keys")
    fun addKey(@RequestBody request: AddKeyRequest): ResponseEntity<AuthorizedKey> {
        // If no keys exist, allow adding the first one (Bootstrap)
        if (repository.count() > 0L) {
            // In a real app, check for administrative privileges here
            // Still don't know if it's a good idea to allow adding keys from the frontend and how
            // to secure it
            // TODO: implement admin key management / or admin rights
        }
        return ResponseEntity.ok(authService.registerKey(request.name, request.publicKey))
    }

    @DeleteMapping("/keys/{id}")
    fun deleteKey(@PathVariable id: Long): ResponseEntity<Void> {
        authService.deleteKey(id)
        return ResponseEntity.ok().build()
    }
}

data class LoginRequest(val challenge: String, val signature: String)

data class AddKeyRequest(val name: String, val publicKey: String)
