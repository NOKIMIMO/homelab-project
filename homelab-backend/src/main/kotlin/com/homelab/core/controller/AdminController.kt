package com.homelab.core.controller

import com.homelab.core.api.dto.PasswordResetRequestDto
import com.homelab.core.api.dto.SignupRequestDto
import com.homelab.core.api.dto.UserDto
import com.homelab.core.api.dto.toDto
import com.homelab.core.config.HomelabConfig
import com.homelab.core.model.auth.PasswordResetRequestRepository
import com.homelab.core.model.auth.SignupRequestRepository
import com.homelab.core.model.auth.UserRepository
import com.homelab.core.service.AuthService
import com.homelab.core.service.JwtService
import com.homelab.core.service.LoginSettingsService
import com.homelab.core.service.RecoveryCodeService
import com.homelab.core.service.UserService
import com.homelab.core.service.module.ModuleConfigService
import com.homelab.sdk.helper.AppLogger
import org.springframework.http.ResponseEntity
import org.springframework.security.access.prepost.PreAuthorize
import org.springframework.web.bind.annotation.*
import java.time.LocalDateTime

@RestController
@RequestMapping("/api/admin")
@PreAuthorize("hasRole('ADMIN')")
@CrossOrigin(origins = ["*"])
class AdminController(
    private val homelabConfig: HomelabConfig,
    private val userService: UserService,
    private val signupRequestRepository: SignupRequestRepository,
    private val passwordResetRequestRepository: PasswordResetRequestRepository,
    private val recoveryCodeService: RecoveryCodeService,
    private val loginSettingsService: LoginSettingsService,
    private val moduleConfigService: ModuleConfigService,
) {

    @GetMapping("/logs")
    fun getLogs(
        @RequestParam(required = false) level: String?,
        @RequestParam(required = false, defaultValue = "300") limit: Int
    ): List<AppLogger.LogEntry> {
        val logs = AppLogger.getLogs()
        return (if (level != null) logs.filter { it.level == level } else logs)
            .takeLast(limit)
    }

    @DeleteMapping("/logs")
    fun clearLogs(): Map<String, Any> {
        AppLogger.clearLogs()
        return mapOf("success" to true)
    }

    @GetMapping("/config")
    fun getConfig(): Map<String, Any> = mapOf(
        "appRoot" to homelabConfig.appRoot,
        "modulesScanPath" to homelabConfig.modulesScanPath,
        "pluginsScanPath" to homelabConfig.pluginsScanPath,
        "logLevel" to AppLogger.getLevel().name
    )

    @PutMapping("/config/log-level")
    fun setLogLevel(@RequestBody body: Map<String, String>): ResponseEntity<Map<String, Any>> {
        val levelStr = body["level"]
            ?: return ResponseEntity.badRequest().body(mapOf("success" to false, "message" to "Missing 'level' field"))
        return try {
            val newLevel = AppLogger.Level.valueOf(levelStr)
            AppLogger.setLevel(newLevel)
            ResponseEntity.ok(mapOf("success" to true, "level" to newLevel.name))
        } catch (_: IllegalArgumentException) {
            ResponseEntity.badRequest().body(mapOf("success" to false, "message" to "Invalid log level: $levelStr"))
        }
    }

    @PutMapping("/login-settings")
    fun updateLoginSettings(@RequestBody body: Map<String, String?>): Map<String, Any?> =
        mapOf("description" to loginSettingsService.setDescription(body["description"]))

    @GetMapping("/recovery-code/status")
    fun recoveryCodeStatus(): Map<String, Any?> = recoveryCodeService.status()

    @PostMapping("/recovery-code/regenerate")
    fun regenerateRecoveryCode(): Map<String, Any> = mapOf("success" to true, "code" to recoveryCodeService.generateNewCode())

    @GetMapping("/users") fun getUsers(): List<UserDto> = userService.getAllUsers().map { it.toDto() }

    @DeleteMapping("/users/{id}")
    fun deleteUser(@PathVariable id: Long): ResponseEntity<Void> {
        userService.deleteUser(id)
        return ResponseEntity.ok().build()
    }
    @PostMapping("/users/{id}/isAdmin/{isAdmin}")
    fun setAdmin(@PathVariable id: Long, @PathVariable isAdmin: Boolean): ResponseEntity<Void> {
        userService.updateUserAdmin(id, isAdmin)
        return ResponseEntity.ok().build()
    }

    @GetMapping("/permissions")
    fun getAvailablePermissions(): Map<String, List<String>> =
        moduleConfigService.scanModuleConfigs(homelabConfig.modulesScanPath)
            .associate { it.config.id to it.config.permissions }

    @PutMapping("/users/{id}/permissions")
    fun setUserPermissions(@PathVariable id: Long, @RequestBody permissions: List<String>): ResponseEntity<Void> {
        userService.updateUserPermissions(id, permissions.toSet())
        return ResponseEntity.ok().build()
    }

    @PutMapping("/users/{id}/roles")
    fun setUserRoles(@PathVariable id: Long, @RequestBody roleIds: List<Long>): ResponseEntity<Void> {
        userService.updateUserRoles(id, roleIds.toSet())
        return ResponseEntity.ok().build()
    }

    @GetMapping("/signup-requests")
    fun getSignupRequests(): List<SignupRequestDto> = signupRequestRepository.findAll().map { it.toDto() }

    @PutMapping("/signup-requests/{id}/approve")
    fun approveSignupRequest(@PathVariable id: Long): ResponseEntity<Any> {
        val opt = signupRequestRepository.findById(id)
        if (!opt.isPresent) return ResponseEntity.notFound().build()
        val req = opt.get()
        if (req.status != "PENDING") {
            return ResponseEntity.badRequest().body(mapOf("success" to false, "message" to "Request already processed"))
        }
        return try {
            val user = userService.registerUser(req.name, req.email, req.publicKey, isAdmin = false, req.passwordHash)
            req.status = "APPROVED"
            req.processedAt = LocalDateTime.now()
            signupRequestRepository.save(req)
            ResponseEntity.ok(mapOf("success" to true, "user" to user.toDto()))
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

    @GetMapping("/password-reset-requests")
    fun getPasswordResetRequests(): List<PasswordResetRequestDto> =
        passwordResetRequestRepository.findAll().map { it.toDto() }

    @PutMapping("/password-reset-requests/{id}/approve")
    fun approvePasswordResetRequest(@PathVariable id: Long): ResponseEntity<Any> {
        val opt = passwordResetRequestRepository.findById(id)
        if (!opt.isPresent) return ResponseEntity.notFound().build()
        val req = opt.get()
        if (req.status != "PENDING") {
            return ResponseEntity.badRequest().body(mapOf("success" to false, "message" to "Request already processed"))
        }
        val user = userService.findByEmail(req.email)
            ?: return ResponseEntity.badRequest().body(mapOf("success" to false, "message" to "User no longer exists"))
        val temporaryPassword = userService.issueTemporaryPassword(user.id!!)
        req.status = "APPROVED"
        req.processedAt = LocalDateTime.now()
        passwordResetRequestRepository.save(req)
        return ResponseEntity.ok(mapOf("success" to true, "temporaryPassword" to temporaryPassword))
    }

    @PutMapping("/password-reset-requests/{id}/reject")
    fun rejectPasswordResetRequest(@PathVariable id: Long): ResponseEntity<Any> {
        val opt = passwordResetRequestRepository.findById(id)
        if (!opt.isPresent) return ResponseEntity.notFound().build()
        val req = opt.get()
        if (req.status != "PENDING") {
            return ResponseEntity.badRequest().body(mapOf("success" to false, "message" to "Request already processed"))
        }
        req.status = "REJECTED"
        req.processedAt = LocalDateTime.now()
        passwordResetRequestRepository.save(req)
        return ResponseEntity.ok(mapOf("success" to true))
    }
}
