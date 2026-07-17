package com.homelab.core.service

import com.homelab.core.model.auth.RecoveryCode
import com.homelab.core.model.auth.RecoveryCodeRepository
import org.junit.jupiter.api.Assertions.assertEquals
import org.junit.jupiter.api.Assertions.assertFalse
import org.junit.jupiter.api.Assertions.assertTrue
import org.junit.jupiter.api.BeforeEach
import org.junit.jupiter.api.Test
import org.mockito.ArgumentCaptor
import org.mockito.Mockito.mock
import org.mockito.Mockito.verify
import org.mockito.Mockito.`when`

class RecoveryCodeServiceTest {

    private lateinit var repository: RecoveryCodeRepository
    private lateinit var service: RecoveryCodeService

    @BeforeEach
    fun setUp() {
        repository = mock(RecoveryCodeRepository::class.java)
        service = RecoveryCodeService(repository)
    }

    @Test
    fun `generateNewCode produces a formatted code and stores only its hash`() {
        val captor = ArgumentCaptor.forClass(RecoveryCode::class.java)
        `when`(repository.save(captor.capture())).thenAnswer { it.arguments[0] }

        val code = service.generateNewCode()

        assertTrue(Regex("^[A-Z0-9]{5}(-[A-Z0-9]{5}){3}$").matches(code), "unexpected code format: $code")
        verify(repository).deleteAll()
        assertFalse(captor.value.codeHash == code)
        assertTrue(AuthService.matchesPassword(captor.value.codeHash, code))
    }

    @Test
    fun `verifyAndConsume returns false when no code has ever been generated`() {
        `when`(repository.findAll()).thenReturn(emptyList())

        assertFalse(service.verifyAndConsume("anything"))
    }

    @Test
    fun `verifyAndConsume accepts the matching plaintext code`() {
        val hash = AuthService.encodePassword("ABCDE-FGHJK-MNPQR-STUVW")
        `when`(repository.findAll()).thenReturn(listOf(RecoveryCode(codeHash = hash)))

        assertTrue(service.verifyAndConsume("ABCDE-FGHJK-MNPQR-STUVW"))
    }

    @Test
    fun `verifyAndConsume rejects a wrong code`() {
        val hash = AuthService.encodePassword("ABCDE-FGHJK-MNPQR-STUVW")
        `when`(repository.findAll()).thenReturn(listOf(RecoveryCode(codeHash = hash)))

        assertFalse(service.verifyAndConsume("WRONG-CODE-HERE-NOPE1"))
    }

    @Test
    fun `status reports absence when no code exists`() {
        `when`(repository.findAll()).thenReturn(emptyList())

        val status = service.status()

        assertEquals(false, status["exists"])
        assertEquals(null, status["createdAt"])
    }

    @Test
    fun `status reports existence and creation time when a code exists`() {
        val recoveryCode = RecoveryCode(codeHash = "hash")
        `when`(repository.findAll()).thenReturn(listOf(recoveryCode))

        val status = service.status()

        assertEquals(true, status["exists"])
        assertEquals(recoveryCode.createdAt, status["createdAt"])
    }
}
