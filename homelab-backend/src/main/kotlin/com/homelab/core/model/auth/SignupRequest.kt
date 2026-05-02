package com.homelab.core.model.auth

import jakarta.persistence.*
import java.time.LocalDateTime

@Entity
@Table(name = "signup_requests")
class SignupRequest(
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    val id: Long? = null,

    @Column(nullable = true)
    var name: String? = null,

    @Column(nullable = false)
    var email: String = "",

    @Column(nullable = true, length = 2048)
    var publicKey: String? = null,

    @Column(nullable = true, length = 2048)
    var passwordPlain: String? = null,

    @Column(nullable = false)
    var status: String = "PENDING",

    @Column(nullable = false)
    val createdAt: LocalDateTime = LocalDateTime.now(),

    @Column(nullable = true)
    var processedAt: LocalDateTime? = null
)

