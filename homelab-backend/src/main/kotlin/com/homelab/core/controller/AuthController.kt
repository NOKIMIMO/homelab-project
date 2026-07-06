package com.homelab.core.controller

import com.homelab.core.model.auth.AddUserRequest
import com.homelab.core.model.auth.LoginRequest
import com.homelab.core.model.auth.User
import com.homelab.core.model.auth.UserRepository
import com.homelab.core.model.auth.SignupRequest
import com.homelab.core.model.auth.SignupRequestRepository
import com.homelab.core.service.AppletService
import com.homelab.core.service.AuthService
import com.homelab.core.service.JwtService
import com.homelab.core.service.UserService
import com.homelab.sdk.helper.AppLogger
import jakarta.servlet.http.HttpServletResponse
import org.springframework.http.ResponseEntity
import org.springframework.web.bind.annotation.*
import java.time.LocalDateTime

@RestController
@RequestMapping("/api/auth")
@CrossOrigin(origins = ["*"])

class AuthController(
    private val authService: AuthService,
    private val userService: UserService,
    private val repository: UserRepository,
    private val signupRequestRepository: SignupRequestRepository,
    private val jwtService: JwtService
) {
    private val log = AppLogger.loggerFor(this::class)

    @GetMapping("/challenge")
    fun getChallenge(): ResponseEntity<Map<String, String>> {
        return ResponseEntity.ok(mapOf("challenge" to authService.generateChallenge()))
    }

    //TODO: Move repository call into service
    @PostMapping("/login")
    fun login(
        @RequestBody request: LoginRequest,
        response: HttpServletResponse
    ): ResponseEntity<Map<String, Any>> {
        // email + pwd
        if (!request.email.isNullOrBlank() && !request.password.isNullOrBlank()) {
            println("Login attempt with email: ${request.email}")
            val userOpt = repository.findByEmail(request.email)
            println("User found: ${userOpt.isPresent}")
            if (userOpt.isPresent) {
                val user = userOpt.get()
                if (authService.verifyPassword(user.passwordHash, request.password)) {
                    val token = jwtService.generateToken(
                        username = user.email,
                        isAdmin = user.isAdmin
                    )
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
                val token = jwtService.generateToken(
                    username = matchedUser.email,
                    isAdmin = matchedUser.isAdmin
                )
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


// TODO:
//    maybe split those into two controllers
    @PostMapping("/signup-requests")
    fun submitSignupRequest(@RequestBody request: AddUserRequest): ResponseEntity<Any> {
        if (request.email.isBlank()) {
            return ResponseEntity.badRequest().body(mapOf("success" to false, "message" to "Email is required"))
        }
        log.debug("request: $request")
        val found = signupRequestRepository.findByEmail(request.email)
        log.debug("found: $found")
        if (found.isPresent) {
            return ResponseEntity.badRequest().body(mapOf("success" to false, "message" to "Email already in use"))
        }


        val passwordHash = AuthService.encodePassword(request.password!!)

        val signup = SignupRequest(name = request.name, email = request.email, publicKey = request.publicKey, passwordHash = passwordHash)

        if (repository.count() == 0L) {
            return try {
                val passwordHash = AuthService.encodePassword(request.password)
                val user = userService.registerUser(request.name, request.email, request.publicKey, isAdmin = true, passwordHash = passwordHash)
                signup.status = "APPROVED"
                signup.processedAt = LocalDateTime.now()
                signupRequestRepository.save(signup)
                ResponseEntity.ok(mapOf("success" to true, "user" to user))
            } catch (e: IllegalArgumentException) {
                ResponseEntity.badRequest().body(mapOf("success" to false, "message" to e.message))
            }
        }


        signupRequestRepository.save(signup)
        return ResponseEntity.ok().build()
    }

}