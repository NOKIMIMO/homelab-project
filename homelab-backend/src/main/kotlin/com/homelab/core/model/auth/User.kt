package com.homelab.core.model.auth

import jakarta.persistence.*
import java.time.LocalDateTime

@Entity
@Table(name = "users")
class User(
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    val id: Long? = null,

    @Column(nullable = false, unique = true)
    var email: String = "",

    @Column(nullable = true)
    var name: String? = null,

    @Column(nullable = true, length = 2048)
    var passwordHash: String? = null,

    @Column(nullable = true, length = 2048)
    var publicKey: String? = null,

    @Column(nullable = false)
    val createdAt: LocalDateTime = LocalDateTime.now()
)

