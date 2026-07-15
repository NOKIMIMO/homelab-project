package com.homelab.core.controller

import com.homelab.core.api.dto.toDto
import com.homelab.core.model.auth.AddUserRequest
import com.homelab.core.model.auth.LoginRequest
import com.homelab.core.model.auth.PasswordResetRequest
import com.homelab.core.model.auth.PasswordResetRequestRepository
import com.homelab.core.model.auth.RecoveryResetRequest
import com.homelab.core.model.auth.UpdatePasswordRequest
import com.homelab.core.model.auth.User
import com.homelab.core.model.auth.UserRepository
import com.homelab.core.model.auth.SignupRequest
import com.homelab.core.model.auth.SignupRequestRepository
import com.homelab.core.model.auth.effectiveAdminPermissions
import com.homelab.core.service.AppletService
import com.homelab.core.service.AuthService
import com.homelab.core.service.JwtService
import com.homelab.core.service.LoginSettingsService
import com.homelab.core.service.RecoveryCodeService
import com.homelab.core.service.UserService
import com.homelab.sdk.helper.AppLogger
import jakarta.servlet.http.HttpServletResponse
import org.springframework.http.ResponseEntity
import org.springframework.security.core.context.SecurityContextHolder
import org.springframework.transaction.annotation.Transactional
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
    private val passwordResetRequestRepository: PasswordResetRequestRepository,
    private val jwtService: JwtService,
    private val recoveryCodeService: RecoveryCodeService,
    private val loginSettingsService: LoginSettingsService
) {
    private val log = AppLogger.loggerFor(this::class)

    @GetMapping("/challenge")
    fun getChallenge(): ResponseEntity<Map<String, String>> {
        return ResponseEntity.ok(mapOf("challenge" to authService.generateChallenge()))
    }

    // Lets the currently logged-in user fetch their own account state (e.g. mustResetPassword)
    // without needing admin rights.
    @GetMapping("/me")
    fun getCurrentUser(): ResponseEntity<Any> {
        val email = SecurityContextHolder.getContext().authentication?.name
            ?: return ResponseEntity.status(401).body(mapOf("success" to false, "message" to "Not authenticated"))
        val user = repository.findByEmail(email).orElse(null)
            ?: return ResponseEntity.status(401).body(mapOf("success" to false, "message" to "Not authenticated"))
        return ResponseEntity.ok(user.toDto())
    }

    // Owner-configurable description shown on the login card. Public since the login page
    // itself is unauthenticated.
    @GetMapping("/login-settings")
    fun getLoginSettings(): Map<String, Any?> = mapOf("description" to loginSettingsService.getDescription())

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
                    val mustResetPassword = user.mustResetPassword
                    if (mustResetPassword) {
                        // Single-use: the temporary password issued on reset approval is
                        // invalidated as soon as it's used once. The user must call
                        // PUT /api/auth/password (with this session's token) before another
                        // password login will work.
                        user.passwordHash = null
                        repository.save(user)
                    }
                    val token = jwtService.generateToken(
                        username = user.email,
                        isAdmin = user.isAdmin,
                        adminPermissions = user.effectiveAdminPermissions()
                    )
                    val cookie = jakarta.servlet.http.Cookie("homelab_token", token)
                    cookie.isHttpOnly = true
                    cookie.path = "/"
                    cookie.maxAge = 86400 * 7 // 24h * 7
                    response.addCookie(cookie)
                    return ResponseEntity.ok(mapOf(
                        "success" to true,
                        "token" to token,
                        "userEmail" to user.email,
                        "mustResetPassword" to mustResetPassword
                    ))
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
                    isAdmin = matchedUser.isAdmin,
                    adminPermissions = matchedUser.effectiveAdminPermissions()
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
                val user = userService.registerUser(request.name, request.email, request.publicKey, isAdmin = true, passwordHash = passwordHash)
                signup.status = "APPROVED"
                signup.processedAt = LocalDateTime.now()
                signupRequestRepository.save(signup)
                val recoveryCode = recoveryCodeService.generateNewCode()
                ResponseEntity.ok(mapOf("success" to true, "user" to user.toDto(), "recoveryCode" to recoveryCode))
            } catch (e: Exception) {
                // Catches more than IllegalArgumentException on purpose: registerUser's DB insert
                // above may already have committed before signup/recovery-code bookkeeping throws,
                // and a narrow catch let that escape as an unhandled 500 while the user row (and
                // thus the account) still existed. Any failure here is reported the same way.
                log.error("Bootstrap signup failed for ${request.email}", e)
                ResponseEntity.badRequest().body(mapOf("success" to false, "message" to (e.message ?: "Signup failed")))
            }
        }


        signupRequestRepository.save(signup)
        // Non-empty body: the frontend used to call res.json() on an empty 200 here, which threw
        // and made a successfully-recorded signup request look like a failure to the user.
        return ResponseEntity.ok(mapOf("success" to true, "message" to "Demande d'inscription envoyée, en attente de validation par un administrateur."))
    }

    // Small reset: a logged-out user asks for their password back. An admin reviews and
    // approves the request from the backend, which issues a one-time temporary password
    // (see AdminController.approvePasswordResetRequest). Distinct from the "big reset"
    // recovery-code flow below, which wipes every user.
    @PostMapping("/password-reset-requests")
    fun requestPasswordReset(@RequestBody body: Map<String, String>): ResponseEntity<Any> {
        val email = body["email"]?.trim()
        if (email.isNullOrBlank()) {
            return ResponseEntity.badRequest().body(mapOf("success" to false, "message" to "Email is required"))
        }
        // Always respond with the same generic success message whether or not the account
        // exists, or already has a pending request, so this endpoint can't be used to
        // enumerate registered emails. The request is only actually recorded when valid.
        if (repository.findByEmail(email).isPresent && !passwordResetRequestRepository.existsByEmailAndStatus(email, "PENDING")) {
            passwordResetRequestRepository.save(PasswordResetRequest(email = email))
        }
        return ResponseEntity.ok(mapOf(
            "success" to true,
            "message" to "If an account exists for this email, a reset request has been submitted for admin approval."
        ))
    }

    // Self-service password change. Requires proof of the current password, except right
    // after a one-time temporary password login (mustResetPassword), where the login itself
    // already proved identity.
    @PutMapping("/password")
    fun updatePassword(@RequestBody request: UpdatePasswordRequest): ResponseEntity<Any> {
        val email = SecurityContextHolder.getContext().authentication?.name
            ?: return ResponseEntity.status(401).body(mapOf("success" to false, "message" to "Not authenticated"))
        val user = repository.findByEmail(email).orElse(null)
            ?: return ResponseEntity.status(401).body(mapOf("success" to false, "message" to "Not authenticated"))

        if (request.newPassword.isBlank() || request.newPassword.length < 8) {
            return ResponseEntity.badRequest().body(mapOf("success" to false, "message" to "Password must be at least 8 characters"))
        }
        if (!user.mustResetPassword && !authService.verifyPassword(user.passwordHash, request.currentPassword)) {
            return ResponseEntity.status(403).body(mapOf("success" to false, "message" to "Current password is incorrect"))
        }

        userService.updatePassword(user.id!!, AuthService.encodePassword(request.newPassword))
        return ResponseEntity.ok(mapOf("success" to true))
    }

    // Self-service account deletion. A full admin must transfer their admin role first (see
    // AdminController.transferAdmin) so the instance is never left without an admin. The JWT
    // filter re-derives the caller's identity from the DB on every request, so once this row is
    // gone the very next request with this token is rejected - the frontend also clears the
    // stored token and logs out immediately on a successful response.
    @DeleteMapping("/account")
    fun deleteOwnAccount(): ResponseEntity<Any> {
        val email = SecurityContextHolder.getContext().authentication?.name
            ?: return ResponseEntity.status(401).body(mapOf("success" to false, "message" to "Not authenticated"))
        val user = repository.findByEmail(email).orElse(null)
            ?: return ResponseEntity.status(401).body(mapOf("success" to false, "message" to "Not authenticated"))
        if (user.isAdmin) {
            return ResponseEntity.status(403).body(mapOf(
                "success" to false,
                "message" to "Un administrateur doit d'abord transférer son rôle avant de supprimer son compte"
            ))
        }
        userService.deleteUser(user.id!!)
        return ResponseEntity.ok(mapOf("success" to true))
    }

    // Emergency access recovery: presenting a valid, unused recovery code wipes every existing
    // user and re-bootstraps a fresh admin account in one step. Used when all admin accounts/
    // credentials are lost. A fresh recovery code is issued immediately so the instance is
    // never left without one.
    @Transactional
    @PostMapping("/reset")
    fun resetWithRecoveryCode(
        @RequestBody request: RecoveryResetRequest,
        response: HttpServletResponse
    ): ResponseEntity<Map<String, Any>> {
        if (!recoveryCodeService.verifyAndConsume(request.code)) {
            return ResponseEntity.status(403).body(mapOf("success" to false, "message" to "Invalid recovery code"))
        }

        if (request.email.isBlank() || (request.password.isNullOrBlank() && request.publicKey.isNullOrBlank())) {
            return ResponseEntity.badRequest()
                .body(mapOf("success" to false, "message" to "Email and password or publicKey are required"))
        }

        return try {
            userService.deleteAllUsers()
            signupRequestRepository.deleteAll()

            val passwordHash = request.password?.let { AuthService.encodePassword(it) }
            val user = userService.registerUser(request.name, request.email, request.publicKey, isAdmin = true, passwordHash = passwordHash)
            val newRecoveryCode = recoveryCodeService.generateNewCode()

            val token = jwtService.generateToken(username = user.email, isAdmin = true)
            val cookie = jakarta.servlet.http.Cookie("homelab_token", token)
            cookie.isHttpOnly = true
            cookie.path = "/"
            cookie.maxAge = 86400 * 7
            response.addCookie(cookie)

            ResponseEntity.ok(
                mapOf(
                    "success" to true,
                    "token" to token,
                    "userEmail" to user.email,
                    "recoveryCode" to newRecoveryCode
                )
            )
        } catch (e: IllegalArgumentException) {
            ResponseEntity.badRequest().body(mapOf("success" to false, "message" to (e.message ?: "Reset failed")))
        }
    }

}