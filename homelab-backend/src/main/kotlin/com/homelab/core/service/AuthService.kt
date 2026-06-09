package com.homelab.core.service

import com.homelab.core.controller.AppletControler
import com.homelab.core.helper.AppLogger
import com.homelab.core.model.auth.User
import com.homelab.core.model.auth.UserRepository
import java.security.KeyFactory
import java.security.Signature
import java.security.spec.X509EncodedKeySpec
import java.util.*
import java.util.concurrent.ConcurrentHashMap
import org.springframework.stereotype.Service
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder

@Service
class AuthService(private val repository: UserRepository) {
    private val log = AppLogger.loggerFor(AppletControler::class)

    private val challenges = ConcurrentHashMap<String, String>()
    private val passwordEncoder = BCryptPasswordEncoder()

    fun generateChallenge(): String {
        val challenge = UUID.randomUUID().toString()
        challenges[challenge] = challenge
        return challenge
    }
    companion object {
        private val passwordEncoder = BCryptPasswordEncoder()

        fun encodePassword(password: String): String {
            return passwordEncoder.encode(password)
        }
    }

    fun verifySignature(publicKeyStr: String, signatureBase64: String, challenge: String): Boolean {
        if (!challenges.containsKey(challenge)) return false
        challenges.remove(challenge)

        return try {
            val publicKey = parsePublicKey(publicKeyStr)
            val sig = Signature.getInstance("SHA256withRSA")
            sig.initVerify(publicKey)
            sig.update(challenge.toByteArray())
            sig.verify(Base64.getDecoder().decode(signatureBase64))
        } catch (e: Exception) {
            log.error("Verification error during signature verification", e)
            false
        }
    }

    private fun parsePublicKey(keyStr: String): java.security.PublicKey {
        val clean = keyStr.trim()
        val kf = KeyFactory.getInstance("RSA")

        // X.509 (SPKI)
        if (clean.contains("BEGIN PUBLIC KEY")) {
            val keyBytes =
                    Base64.getDecoder()
                            .decode(
                                    clean.replace("-----BEGIN PUBLIC KEY-----", "")
                                            .replace("-----END PUBLIC KEY-----", "")
                                            .replace("\n", "")
                                            .replace("\r", "")
                                            .trim()
                            )
            return kf.generatePublic(X509EncodedKeySpec(keyBytes))
        }

        // OpenSSH or SSH2
        var base64Part = ""
        if (clean.startsWith("ssh-rsa")) {
            base64Part = clean.split(" ").getOrNull(1) ?: ""
        } else if (clean.contains("BEGIN SSH2 PUBLIC KEY")) {
            base64Part =
                    clean.lines()
                            .filter { !it.contains("---") && !it.contains(":") }
                            .joinToString("")
        }

        if (base64Part.isNotEmpty()) {
            val bytes = Base64.getDecoder().decode(base64Part)
            val buffer = java.nio.ByteBuffer.wrap(bytes)

            fun readLength(): Int = buffer.int
            fun readBytes(): ByteArray {
                val len = readLength()
                val b = ByteArray(len)
                buffer.get(b)
                return b
            }

            val type = String(readBytes())
            if (type == "ssh-rsa") {
                val exponent = java.math.BigInteger(readBytes())
                val modulus = java.math.BigInteger(readBytes())
                return kf.generatePublic(java.security.spec.RSAPublicKeySpec(modulus, exponent))
            }
        }

        throw IllegalArgumentException("Unsupported public key format")
    }

    fun getAllUsers(): List<User> = repository.findAll()

    fun registerUser(name: String?, email: String, publicKeyPem: String?, passwordHash: String?): User {
        if (publicKeyPem.isNullOrBlank() && passwordHash.isNullOrBlank()) {
            throw IllegalArgumentException("Either publicKey or password must be provided")
        }

        if (repository.findByEmail(email).isPresent) {
            throw IllegalArgumentException("User with this email already exists")
        }

        val user = User(name = name, email = email, publicKey = publicKeyPem, passwordHash = passwordHash)
        return repository.save(user)
    }

    fun deleteUser(id: Long) = repository.deleteById(id)

    fun verifyPassword(storedHash: String?, passwordPlain: String?): Boolean {
        if (storedHash == null || passwordPlain == null) return false
        return try {
            passwordEncoder.matches(passwordPlain, storedHash)
        } catch (_: Exception) {
            false
        }
    }
}
