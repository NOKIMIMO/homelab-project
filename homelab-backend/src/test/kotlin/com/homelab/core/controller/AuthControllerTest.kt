package com.homelab.core.controller

import com.homelab.core.model.auth.AddUserRequest
import com.homelab.core.model.auth.LoginRequest
import com.homelab.core.model.auth.PasswordResetRequestRepository
import com.homelab.core.model.auth.RecoveryResetRequest
import com.homelab.core.model.auth.SignupRequest
import com.homelab.core.model.auth.SignupRequestRepository
import com.homelab.core.model.auth.UpdatePasswordRequest
import com.homelab.core.model.auth.User
import com.homelab.core.model.auth.UserRepository
import com.homelab.core.service.AuthService
import com.homelab.core.service.JwtService
import com.homelab.core.service.LoginSettingsService
import com.homelab.core.service.RecoveryCodeService
import com.homelab.core.service.UserService
import org.junit.jupiter.api.AfterEach
import org.junit.jupiter.api.Assertions.assertEquals
import org.junit.jupiter.api.Assertions.assertNull
import org.junit.jupiter.api.BeforeEach
import org.junit.jupiter.api.Test
import org.mockito.ArgumentMatchers.anyString
import org.mockito.Mockito.mock
import org.mockito.Mockito.never
import org.mockito.Mockito.verify
import org.mockito.Mockito.`when`
import org.mockito.kotlin.any
import org.mockito.kotlin.anyOrNull
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken
import org.springframework.security.core.context.SecurityContextHolder
import java.util.Optional

class AuthControllerTest {

    private lateinit var authService: AuthService
    private lateinit var userService: UserService
    private lateinit var userRepository: UserRepository
    private lateinit var signupRequestRepository: SignupRequestRepository
    private lateinit var passwordResetRequestRepository: PasswordResetRequestRepository
    private lateinit var jwtService: JwtService
    private lateinit var recoveryCodeService: RecoveryCodeService
    private lateinit var loginSettingsService: LoginSettingsService
    private lateinit var controller: AuthController
    private lateinit var response: jakarta.servlet.http.HttpServletResponse

    @BeforeEach
    fun setUp() {
        authService = mock(AuthService::class.java)
        userService = mock(UserService::class.java)
        userRepository = mock(UserRepository::class.java)
        signupRequestRepository = mock(SignupRequestRepository::class.java)
        passwordResetRequestRepository = mock(PasswordResetRequestRepository::class.java)
        jwtService = mock(JwtService::class.java)
        recoveryCodeService = mock(RecoveryCodeService::class.java)
        loginSettingsService = mock(LoginSettingsService::class.java)
        response = mock(jakarta.servlet.http.HttpServletResponse::class.java)
        controller = AuthController(
            authService, userService, userRepository, signupRequestRepository,
            passwordResetRequestRepository, jwtService, recoveryCodeService, loginSettingsService
        )
    }

    @AfterEach
    fun tearDown() {
        SecurityContextHolder.clearContext()
    }

    private fun authenticateAs(email: String) {
        SecurityContextHolder.getContext().authentication = UsernamePasswordAuthenticationToken(email, null, emptyList())
    }

    @Test
    fun `getChallenge returns a freshly generated challenge`() {
        `when`(authService.generateChallenge()).thenReturn("chal-123")

        val response = controller.getChallenge()

        assertEquals(mapOf("challenge" to "chal-123"), response.body)
    }

    @Test
    fun `getCurrentUser returns 401 when nobody is authenticated`() {
        val result = controller.getCurrentUser()

        assertEquals(401, result.statusCode.value())
    }

    @Test
    fun `login with correct password issues a token and rotates a temporary password`() {
        val user = User(email = "user@example.com", passwordHash = "hash", mustResetPassword = true)
        `when`(userRepository.findByEmail("user@example.com")).thenReturn(Optional.of(user))
        `when`(authService.verifyPassword("hash", "s3cret")).thenReturn(true)
        `when`(jwtService.generateToken("user@example.com", false, emptySet())).thenReturn("jwt-token")

        val result = controller.login(LoginRequest(email = "user@example.com", password = "s3cret"), response)

        assertEquals(200, result.statusCode.value())
        assertEquals(true, result.body?.get("success"))
        assertEquals("jwt-token", result.body?.get("token"))
        assertEquals(true, result.body?.get("mustResetPassword"))
        assertNull(user.passwordHash)
        verify(userRepository).save(user)
        verify(response).addCookie(org.mockito.ArgumentMatchers.any())
    }

    @Test
    fun `login with a wrong password returns 401`() {
        val user = User(email = "user@example.com", passwordHash = "hash")
        `when`(userRepository.findByEmail("user@example.com")).thenReturn(Optional.of(user))
        `when`(authService.verifyPassword("hash", "wrong")).thenReturn(false)

        val result = controller.login(LoginRequest(email = "user@example.com", password = "wrong"), response)

        assertEquals(401, result.statusCode.value())
    }

    @Test
    fun `login with a valid challenge and signature matches the owning user`() {
        val user = User(email = "user@example.com", publicKey = "pub-key")
        `when`(userRepository.findAll()).thenReturn(listOf(user))
        `when`(authService.verifySignature("pub-key", "sig", "chal")).thenReturn(true)
        `when`(jwtService.generateToken("user@example.com", false, emptySet())).thenReturn("jwt-token")

        val result = controller.login(LoginRequest(challenge = "chal", signature = "sig"), response)

        assertEquals(200, result.statusCode.value())
        assertEquals("user@example.com", result.body?.get("userEmail"))
    }

    @Test
    fun `login with an invalid signature returns 401`() {
        `when`(userRepository.findAll()).thenReturn(emptyList())

        val result = controller.login(LoginRequest(challenge = "chal", signature = "sig"), response)

        assertEquals(401, result.statusCode.value())
    }

    @Test
    fun `login with neither credentials nor challenge returns 400`() {
        val result = controller.login(LoginRequest(), response)

        assertEquals(400, result.statusCode.value())
    }

    @Test
    fun `submitSignupRequest rejects a blank email`() {
        val result = controller.submitSignupRequest(AddUserRequest(email = "", password = "pw"))

        assertEquals(400, result.statusCode.value())
    }

    @Test
    fun `submitSignupRequest rejects an email already requested`() {
        `when`(signupRequestRepository.findByEmail("a@example.com")).thenReturn(Optional.of(SignupRequest(email = "a@example.com")))

        val result = controller.submitSignupRequest(AddUserRequest(email = "a@example.com", password = "pw"))

        assertEquals(400, result.statusCode.value())
    }

    @Test
    fun `submitSignupRequest bootstraps and auto-approves the first user as admin`() {
        `when`(signupRequestRepository.findByEmail("admin@example.com")).thenReturn(Optional.empty())
        `when`(userRepository.count()).thenReturn(0L)
        val createdUser = User(id = 1L, email = "admin@example.com", isAdmin = true)
        `when`(userService.registerUser(eq(null), eq("admin@example.com"), eq(null), eq(true), anyString(), eq(emptySet()))).thenReturn(createdUser)
        `when`(recoveryCodeService.generateNewCode()).thenReturn("RECOVERY-CODE")

        val result = controller.submitSignupRequest(AddUserRequest(email = "admin@example.com", password = "s3cretpw"))

        assertEquals(200, result.statusCode.value())
        val body = result.body as Map<*, *>
        assertEquals(true, body["success"])
        assertEquals("RECOVERY-CODE", body["recoveryCode"])
        verify(signupRequestRepository).save(org.mockito.ArgumentMatchers.any())
    }

    @Test
    fun `submitSignupRequest queues a pending request when users already exist`() {
        `when`(signupRequestRepository.findByEmail("user@example.com")).thenReturn(Optional.empty())
        `when`(userRepository.count()).thenReturn(1L)

        val result = controller.submitSignupRequest(AddUserRequest(email = "user@example.com", password = "s3cretpw"))

        assertEquals(200, result.statusCode.value())
        assertEquals(true, (result.body as Map<*, *>)["success"])
        verify(userService, never()).registerUser(
            anyOrNull(), any(), anyOrNull(), any(), anyOrNull(), any()
        )
    }

    @Test
    fun `requestPasswordReset rejects a blank email`() {
        val result = controller.requestPasswordReset(mapOf("email" to "  "))

        assertEquals(400, result.statusCode.value())
    }

    @Test
    fun `requestPasswordReset does not create a duplicate pending request`() {
        `when`(userRepository.findByEmail("user@example.com")).thenReturn(Optional.of(User(email = "user@example.com")))
        `when`(passwordResetRequestRepository.existsByEmailAndStatus("user@example.com", "PENDING")).thenReturn(true)

        controller.requestPasswordReset(mapOf("email" to "user@example.com"))

        verify(passwordResetRequestRepository, never()).save(org.mockito.ArgumentMatchers.any())
    }

    @Test
    fun `updatePassword returns 401 when not authenticated`() {
        val result = controller.updatePassword(UpdatePasswordRequest(newPassword = "newpassword123"))

        assertEquals(401, result.statusCode.value())
    }

    @Test
    fun `updatePassword rejects a password shorter than 8 characters`() {
        authenticateAs("user@example.com")
        `when`(userRepository.findByEmail("user@example.com")).thenReturn(Optional.of(User(email = "user@example.com")))

        val result = controller.updatePassword(UpdatePasswordRequest(newPassword = "short"))

        assertEquals(400, result.statusCode.value())
    }

    @Test
    fun `updatePassword rejects an incorrect current password`() {
        authenticateAs("user@example.com")
        val user = User(email = "user@example.com", passwordHash = "hash", mustResetPassword = false)
        `when`(userRepository.findByEmail("user@example.com")).thenReturn(Optional.of(user))
        `when`(authService.verifyPassword("hash", "wrong")).thenReturn(false)

        val result = controller.updatePassword(UpdatePasswordRequest(currentPassword = "wrong", newPassword = "newpassword123"))

        assertEquals(403, result.statusCode.value())
    }

    @Test
    fun `updatePassword succeeds when mustResetPassword bypasses the current-password check`() {
        authenticateAs("user@example.com")
        val user = User(id = 5L, email = "user@example.com", mustResetPassword = true)
        `when`(userRepository.findByEmail("user@example.com")).thenReturn(Optional.of(user))

        val result = controller.updatePassword(UpdatePasswordRequest(newPassword = "newpassword123"))

        assertEquals(200, result.statusCode.value())
        verify(userService).updatePassword(eq(5L), anyString())
    }

    @Test
    fun `deleteOwnAccount forbids a full admin from deleting themselves directly`() {
        authenticateAs("admin@example.com")
        `when`(userRepository.findByEmail("admin@example.com")).thenReturn(Optional.of(User(id = 1L, email = "admin@example.com", isAdmin = true)))

        val result = controller.deleteOwnAccount()

        assertEquals(403, result.statusCode.value())
        verify(userService, never()).deleteUser(org.mockito.ArgumentMatchers.anyLong())
    }

    @Test
    fun `deleteOwnAccount deletes a non-admin user`() {
        authenticateAs("user@example.com")
        `when`(userRepository.findByEmail("user@example.com")).thenReturn(Optional.of(User(id = 2L, email = "user@example.com", isAdmin = false)))

        val result = controller.deleteOwnAccount()

        assertEquals(200, result.statusCode.value())
        verify(userService).deleteUser(2L)
    }

    @Test
    fun `resetWithRecoveryCode rejects an invalid code`() {
        `when`(recoveryCodeService.verifyAndConsume("WRONG")).thenReturn(false)

        val result = controller.resetWithRecoveryCode(RecoveryResetRequest(code = "WRONG", email = "a@example.com", password = "pw"), response)

        assertEquals(403, result.statusCode.value())
        verify(userService, never()).deleteAllUsers()
    }

    @Test
    fun `resetWithRecoveryCode wipes all users and re-bootstraps an admin`() {
        `when`(recoveryCodeService.verifyAndConsume("GOOD")).thenReturn(true)
        val newAdmin = User(id = 9L, email = "new-admin@example.com", isAdmin = true)
        `when`(userService.registerUser(eq(null), eq("new-admin@example.com"), eq(null), eq(true), anyString(), eq(emptySet()))).thenReturn(newAdmin)
        `when`(recoveryCodeService.generateNewCode()).thenReturn("NEXT-CODE")
        `when`(jwtService.generateToken("new-admin@example.com", true)).thenReturn("jwt-token")

        val result = controller.resetWithRecoveryCode(
            RecoveryResetRequest(code = "GOOD", email = "new-admin@example.com", password = "s3cretpw"), response
        )

        assertEquals(200, result.statusCode.value())
        verify(userService).deleteAllUsers()
        verify(signupRequestRepository).deleteAll()
        assertEquals("NEXT-CODE", result.body?.get("recoveryCode"))
    }

    private fun <T> eq(value: T): T = org.mockito.ArgumentMatchers.eq(value)
}
