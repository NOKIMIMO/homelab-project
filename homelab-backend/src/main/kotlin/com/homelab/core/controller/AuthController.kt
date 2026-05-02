package com.homelab.core.controller

import com.homelab.core.model.auth.AddUserRequest
import com.homelab.core.model.auth.LoginRequest
import com.homelab.core.model.auth.User
import com.homelab.core.model.auth.UserRepository
import com.homelab.core.model.auth.SignupRequest
import com.homelab.core.model.auth.SignupRequestRepository
import com.homelab.core.service.AuthService
import com.homelab.core.service.JwtService
import jakarta.servlet.http.HttpServletResponse
import org.springframework.http.ResponseEntity
import org.springframework.web.bind.annotation.*
import java.time.LocalDateTime

@RestController
@RequestMapping("/api/auth")
@CrossOrigin(origins = ["*"])

class AuthController(
        private val authService: AuthService,
        private val repository: UserRepository,
        private val signupRequestRepository: SignupRequestRepository,
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
        // email + pwd
        if (!request.email.isNullOrBlank() && !request.password.isNullOrBlank()) {
            val userOpt = repository.findByEmail(request.email)
            if (userOpt.isPresent) {
                val user = userOpt.get()
                if (authService.verifyPassword(user.passwordHash, request.password)) {
                    val token = jwtService.generateToken(user.email)
                    val cookie = jakarta.servlet.http.Cookie("homelab_token", token)
                    cookie.isHttpOnly = true
                    cookie.path = "/"
                    cookie.maxAge = 86400 * 7 // 24h * 7
                    response.addCookie(cookie)
                    return ResponseEntity.ok(mapOf("success" to true, "token" to token, "userEmail" to user.email))
                }
            }
            return ResponseEntity.status(401).body(mapOf("success" to false, "message" to "Invalid credentials"))
        }

        // chall + sig
        if (!request.challenge.isNullOrBlank() && !request.signature.isNullOrBlank()) {
            val users = repository.findAll()
            var matchedUser: User? = null

            for (u in users) {
                if (u.publicKey != null && authService.verifySignature(u.publicKey!!, request.signature, request.challenge)) {
                    matchedUser = u
                    break
                }
            }

            return if (matchedUser != null) {
                val token = jwtService.generateToken(matchedUser.email)
                val cookie = jakarta.servlet.http.Cookie("homelab_token", token)
                cookie.isHttpOnly = true
                cookie.path = "/"
                cookie.maxAge = 86400 * 7 // 24h * 7
                response.addCookie(cookie)
                ResponseEntity.ok(mapOf("success" to true, "token" to token, "userEmail" to matchedUser.email))
            } else {
                ResponseEntity.status(401).body(mapOf("success" to false, "message" to "Invalid signature"))
            }
        }

        return ResponseEntity.status(400).body(mapOf("success" to false, "message" to "Invalid request"))
    }

    @GetMapping("/users") fun getUsers(): List<User> = authService.getAllUsers()

    @DeleteMapping("/users/{id}")
    fun deleteUser(@PathVariable id: Long): ResponseEntity<Void> {
        authService.deleteUser(id)
        return ResponseEntity.ok().build()
    }
// TODO:
//    maybe split those into two controllers
    @PostMapping("/signup-requests")
    fun submitSignupRequest(@RequestBody request: AddUserRequest): ResponseEntity<Any> {
        if (request.email.isBlank()) {
            return ResponseEntity.badRequest().body(mapOf("success" to false, "message" to "Email is required"))
        }

        val signup = SignupRequest(name = request.name, email = request.email, publicKey = request.publicKey, passwordPlain = request.password)

        if (repository.count() == 0L) {
            return try {
                val user = authService.registerUser(request.name, request.email, request.publicKey, request.password)
                signup.status = "APPROVED"
                signup.processedAt = LocalDateTime.now()
                signupRequestRepository.save(signup)
                ResponseEntity.ok(mapOf("success" to true, "user" to user))
            } catch (e: IllegalArgumentException) {
                ResponseEntity.badRequest().body(mapOf("success" to false, "message" to e.message))
            }
        }

        val saved = signupRequestRepository.save(signup)
        return ResponseEntity.ok(saved)
    }

    @GetMapping("/signup-requests")
    fun getSignupRequests(): List<SignupRequest> = signupRequestRepository.findAll()

    @PutMapping("/signup-requests/{id}/approve")
    fun approveSignupRequest(@PathVariable id: Long): ResponseEntity<Any> {
        val opt = signupRequestRepository.findById(id)
        if (!opt.isPresent) return ResponseEntity.notFound().build()
        val req = opt.get()
        if (req.status != "PENDING") {
            return ResponseEntity.badRequest().body(mapOf("success" to false, "message" to "Request already processed"))
        }
        return try {
            val user = authService.registerUser(req.name, req.email, req.publicKey, req.passwordPlain)
            req.status = "APPROVED"
            req.processedAt = LocalDateTime.now()
            signupRequestRepository.save(req)
            ResponseEntity.ok(mapOf("success" to true, "user" to user))
        } catch (e: IllegalArgumentException) {
            ResponseEntity.badRequest().body(mapOf("success" to false, "message" to e.message))
        }
    }

    @PutMapping("/signup-requests/{id}/reject")
    fun rejectSignupRequest(@PathVariable id: Long): ResponseEntity<Any> {
        val opt = signupRequestRepository.findById(id)
        if (!opt.isPresent) return ResponseEntity.notFound().build()
        val req = opt.get()
        if (req.status != "PENDING") {
            return ResponseEntity.badRequest().body(mapOf("success" to false, "message" to "Request already processed"))
        }
        req.status = "REJECTED"
        req.processedAt = LocalDateTime.now()
        signupRequestRepository.save(req)
        return ResponseEntity.ok(mapOf("success" to true))
    }
}