package com.homelab.core.service

import com.homelab.core.model.auth.RecoveryCode
import com.homelab.core.model.auth.RecoveryCodeRepository
import org.springframework.stereotype.Service
import java.security.SecureRandom

// Manages the single emergency recovery code that can wipe all users and re-bootstrap a
// fresh admin account. Only one code is ever active at a time; generating a new one
// invalidates the previous one.
@Service
class RecoveryCodeService(private val repository: RecoveryCodeRepository) {

    companion object {
        // Crockford-ish alphabet, excludes ambiguous characters (0/O, 1/I/L, etc).
        private const val ALPHABET = "ABCDEFGHJKMNPQRSTUVWXYZ23456789"
        private const val GROUP_COUNT = 4
        private const val GROUP_LENGTH = 5
    }

    private val secureRandom = SecureRandom()

    fun generateNewCode(): String {
        val plain = (1..GROUP_COUNT)
            .joinToString("-") {
                (1..GROUP_LENGTH)
                    .map { ALPHABET[secureRandom.nextInt(ALPHABET.length)] }
                    .joinToString("")
            }

        val hash = AuthService.encodePassword(plain)
        repository.deleteAll()
        repository.save(RecoveryCode(codeHash = hash))
        return plain
    }

    fun verifyAndConsume(code: String): Boolean {
        val current = repository.findAll().firstOrNull() ?: return false
        return AuthService.matchesPassword(current.codeHash, code)
    }

    fun status(): Map<String, Any?> {
        val current = repository.findAll().firstOrNull()
        return mapOf("exists" to (current != null), "createdAt" to current?.createdAt)
    }
}
