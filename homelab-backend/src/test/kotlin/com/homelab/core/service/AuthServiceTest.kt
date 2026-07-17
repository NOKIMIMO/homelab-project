package com.homelab.core.service

import org.junit.jupiter.api.Assertions.assertFalse
import org.junit.jupiter.api.Assertions.assertNotEquals
import org.junit.jupiter.api.Assertions.assertTrue
import org.junit.jupiter.api.Test
import java.security.KeyPairGenerator
import java.security.Signature
import java.util.Base64

class AuthServiceTest {

    private val service = AuthService()

    @Test
    fun `generateChallenge produces unique values`() {
        val a = service.generateChallenge()
        val b = service.generateChallenge()

        assertNotEquals(a, b)
    }

    @Test
    fun `encodePassword produces a hash that matchesPassword can verify`() {
        val hash = AuthService.encodePassword("s3cret!")

        assertTrue(AuthService.matchesPassword(hash, "s3cret!"))
        assertFalse(AuthService.matchesPassword(hash, "wrong"))
    }

    @Test
    fun `matchesPassword and verifyPassword return false for null inputs`() {
        assertFalse(AuthService.matchesPassword(null, "anything"))
        assertFalse(AuthService.matchesPassword("hash", null))
        assertFalse(service.verifyPassword(null, "anything"))
        assertFalse(service.verifyPassword("hash", null))
    }

    @Test
    fun `verifyPassword matches a previously encoded password`() {
        val hash = AuthService.encodePassword("hunter2")

        assertTrue(service.verifyPassword(hash, "hunter2"))
    }

    @Test
    fun `verifySignature returns false for a challenge that was never issued`() {
        assertFalse(service.verifySignature("irrelevant-key", "irrelevant-signature", "unknown-challenge"))
    }

    @Test
    fun `verifySignature accepts a valid RSA signature over an issued challenge`() {
        val challenge = service.generateChallenge()
        val keyPair = KeyPairGenerator.getInstance("RSA").apply { initialize(2048) }.genKeyPair()

        val signature = Signature.getInstance("SHA256withRSA").apply {
            initSign(keyPair.private)
            update(challenge.toByteArray())
        }.sign()

        val pem = "-----BEGIN PUBLIC KEY-----\n" +
            Base64.getEncoder().encodeToString(keyPair.public.encoded) +
            "\n-----END PUBLIC KEY-----"

        val result = service.verifySignature(pem, Base64.getEncoder().encodeToString(signature), challenge)

        assertTrue(result)
    }

    @Test
    fun `verifySignature consumes the challenge so it cannot be replayed`() {
        val challenge = service.generateChallenge()
        val keyPair = KeyPairGenerator.getInstance("RSA").apply { initialize(2048) }.genKeyPair()
        val signature = Signature.getInstance("SHA256withRSA").apply {
            initSign(keyPair.private)
            update(challenge.toByteArray())
        }.sign()
        val pem = "-----BEGIN PUBLIC KEY-----\n" +
            Base64.getEncoder().encodeToString(keyPair.public.encoded) +
            "\n-----END PUBLIC KEY-----"
        val encodedSignature = Base64.getEncoder().encodeToString(signature)

        assertTrue(service.verifySignature(pem, encodedSignature, challenge))
        assertFalse(service.verifySignature(pem, encodedSignature, challenge))
    }

    @Test
    fun `verifySignature returns false when the signature does not match the public key`() {
        val challenge = service.generateChallenge()
        val signingKeyPair = KeyPairGenerator.getInstance("RSA").apply { initialize(2048) }.genKeyPair()
        val otherKeyPair = KeyPairGenerator.getInstance("RSA").apply { initialize(2048) }.genKeyPair()

        val signature = Signature.getInstance("SHA256withRSA").apply {
            initSign(signingKeyPair.private)
            update(challenge.toByteArray())
        }.sign()

        val otherPem = "-----BEGIN PUBLIC KEY-----\n" +
            Base64.getEncoder().encodeToString(otherKeyPair.public.encoded) +
            "\n-----END PUBLIC KEY-----"

        val result = service.verifySignature(otherPem, Base64.getEncoder().encodeToString(signature), challenge)

        assertFalse(result)
    }

    @Test
    fun `verifySignature returns false for an unsupported public key format`() {
        val challenge = service.generateChallenge()

        assertFalse(service.verifySignature("not-a-key", "AAAA", challenge))
    }
}
