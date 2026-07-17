package com.homelab.core.controller

import com.homelab.core.api.dto.ApproveSignupRequest
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
import com.homelab.core.service.ResourceLimitsService
import com.homelab.core.service.SystemRestartService
import com.homelab.core.service.UserService
import com.homelab.core.service.module.ModuleConfigService
import com.homelab.sdk.helper.AppLogger
import org.springframework.http.MediaType
import org.springframework.http.ResponseEntity
import org.springframework.security.access.prepost.PreAuthorize
import org.springframework.security.core.context.SecurityContextHolder
import org.springframework.web.bind.annotation.*
import org.springframework.web.multipart.MultipartFile
import java.time.LocalDateTime

@RestController
@RequestMapping("/api/admin")
// Full admins and ADMIN_ACCESS holders reach every endpoint here by default. The two operations
// that would let an ADMIN_ACCESS holder eject or take over the administrator are individually
// re-restricted below: transferAdmin (hasRole('ADMIN') only), plus deleteUser and setUserRoles,
// which are guarded in UserService against targeting the administrator account.
@PreAuthorize("hasRole('ADMIN') or @permissionService.currentUserHasAdminPermission('ADMIN_ACCESS')")
@CrossOrigin(origins = ["*"])
class AdminController(
    private val homelabConfig: HomelabConfig,
    private val userService: UserService,
    private val signupRequestRepository: SignupRequestRepository,
    private val passwordResetRequestRepository: PasswordResetRequestRepository,
    private val recoveryCodeService: RecoveryCodeService,
    private val loginSettingsService: LoginSettingsService,
    private val moduleConfigService: ModuleConfigService,
    private val resourceLimitsService: ResourceLimitsService,
    private val systemRestartService: SystemRestartService,
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
        "logLevel" to AppLogger.getLevel().name,
        "restartAvailable" to systemRestartService.isAvailable()
    )

    @PostMapping("/restart")
    fun restart(): Map<String, Any> {
        systemRestartService.restart()
        return mapOf("success" to true)
    }

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

    @GetMapping("/resource-limits")
    fun getResourceLimits(): Map<String, Any> = resourceLimitsService.status()

    @PutMapping("/resource-limits")
    fun updateResourceLimits(@RequestBody body: Map<String, Double>): ResponseEntity<Map<String, Any>> {
        val maxRamGb = body["maxRamGb"]
            ?: return ResponseEntity.badRequest().body(mapOf("success" to false, "message" to "Missing 'maxRamGb' field"))
        val maxDiskGb = body["maxDiskGb"]
            ?: return ResponseEntity.badRequest().body(mapOf("success" to false, "message" to "Missing 'maxDiskGb' field"))
        return ResponseEntity.ok(resourceLimitsService.updateLimits(maxRamGb, maxDiskGb))
    }

    // Partial update: only keys present in the body are changed, so e.g. saving a new app name
    // doesn't clobber an already-configured description. The app icon is managed separately
    // below since it's an uploaded file, not a plain string field.
    @PutMapping("/login-settings")
    fun updateLoginSettings(@RequestBody body: Map<String, String?>): Map<String, Any?> = mapOf(
        "description" to (if (body.containsKey("description")) loginSettingsService.setDescription(body["description"]) else loginSettingsService.getDescription()),
        "appName" to (if (body.containsKey("appName")) loginSettingsService.setAppName(body["appName"]) else loginSettingsService.getAppName())
    )

    @PostMapping("/login-settings/icon", consumes = [MediaType.MULTIPART_FORM_DATA_VALUE])
    fun uploadAppIcon(@RequestPart("file") file: MultipartFile): Map<String, Any> {
        loginSettingsService.setAppIcon(file)
        return mapOf("success" to true, "hasAppIcon" to true)
    }

    @DeleteMapping("/login-settings/icon")
    fun deleteAppIcon(): Map<String, Any> {
        loginSettingsService.clearAppIcon()
        return mapOf("success" to true, "hasAppIcon" to false)
    }

    @GetMapping("/recovery-code/status")
    fun recoveryCodeStatus(): Map<String, Any?> = recoveryCodeService.status()

    @PostMapping("/recovery-code/regenerate")
    fun regenerateRecoveryCode(): Map<String, Any> = mapOf("success" to true, "code" to recoveryCodeService.generateNewCode())

    @GetMapping("/users") fun getUsers(): List<UserDto> = userService.getAllUsers().map { it.toDto() }

    @DeleteMapping("/users/{id}")
    fun deleteUser(@PathVariable id: Long): ResponseEntity<Any> =
        // UserService refuses to delete the administrator (see its guard), so an ADMIN_ACCESS
        // holder can never eject the admin this way - it surfaces as a 403 here.
        try {
            userService.deleteUser(id)
            ResponseEntity.ok().build()
        } catch (e: IllegalArgumentException) {
            ResponseEntity.status(403).body(mapOf("success" to false, "message" to e.message))
        }

    // The only way to grant isAdmin: the caller hands off their own admin status to another
    // account and is demoted to a "Moderator" role (see UserService.transferAdmin). There is
    // deliberately no standalone "make this user admin" endpoint - it always stays exactly one
    // isAdmin=true user, transferred atomically, never granted freestanding.
    // Reserved to full admins: this is precisely the "eject the administrator" operation an
    // ADMIN_ACCESS holder must not be able to perform.
    @PreAuthorize("hasRole('ADMIN')")
    @PostMapping("/users/{id}/transfer-admin")
    fun transferAdmin(@PathVariable id: Long): ResponseEntity<Any> {
        val callerEmail = SecurityContextHolder.getContext().authentication?.name
            ?: return ResponseEntity.status(401).body(mapOf("success" to false, "message" to "Not authenticated"))
        val caller = userService.findByEmail(callerEmail)
            ?: return ResponseEntity.status(401).body(mapOf("success" to false, "message" to "Not authenticated"))
        if (caller.id == id) {
            return ResponseEntity.badRequest().body(mapOf("success" to false, "message" to "You are already the administrator of this account"))
        }
        return try {
            userService.transferAdmin(fromId = caller.id!!, toId = id)
            ResponseEntity.ok(mapOf("success" to true))
        } catch (e: IllegalArgumentException) {
            ResponseEntity.badRequest().body(mapOf("success" to false, "message" to e.message))
        }
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
    fun setUserRoles(@PathVariable id: Long, @RequestBody roleIds: List<Long>): ResponseEntity<Any> =
        // UserService refuses to change the administrator's roles (see its guard), so this stays
        // reserved even though the endpoint itself is open to ADMIN_ACCESS holders.
        try {
            userService.updateUserRoles(id, roleIds.toSet())
            ResponseEntity.ok().build()
        } catch (e: IllegalArgumentException) {
            ResponseEntity.status(403).body(mapOf("success" to false, "message" to e.message))
        }

    // Account approval (and the reset/reject variants below) is an ordinary admin-panel task, so
    // it is available to ADMIN_ACCESS holders via the controller-level rule - no extra annotation.
    @GetMapping("/signup-requests")
    fun getSignupRequests(): List<SignupRequestDto> = signupRequestRepository.findAll().map { it.toDto() }

    // A role must be assigned as part of approval so the account isn't left roleless (and thus
    // moduleless) until an admin remembers to circle back and set one via the Access tab.
    @PutMapping("/signup-requests/{id}/approve")
    fun approveSignupRequest(@PathVariable id: Long, @RequestBody(required = false) body: ApproveSignupRequest?): ResponseEntity<Any> {
        val opt = signupRequestRepository.findById(id)
        if (!opt.isPresent) return ResponseEntity.notFound().build()
        val req = opt.get()
        if (req.status != "PENDING") {
            return ResponseEntity.badRequest().body(mapOf("success" to false, "message" to "Request already processed"))
        }
        val roleIds = body?.roleIds.orEmpty()
        if (roleIds.isEmpty()) {
            return ResponseEntity.badRequest().body(mapOf("success" to false, "message" to "At least one role is required to approve the request"))
        }
        return try {
            val user = userService.registerUser(req.name, req.email, req.publicKey, isAdmin = false, req.passwordHash, roleIds = roleIds.toSet())
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
