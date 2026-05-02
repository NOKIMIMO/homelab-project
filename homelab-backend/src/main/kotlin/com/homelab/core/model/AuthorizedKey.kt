package com.homelab.core.model

import jakarta.persistence.*
import java.time.LocalDateTime

@Entity
@Table(name = "authorized_keys")
class AuthorizedKey(
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    val id: Long? = null,

    @Column(nullable = false)
    var name: String = "",

    @Column(nullable = false, length = 2048)
    val publicKey: String = "",

    @Column(nullable = false)
    val createdAt: LocalDateTime = LocalDateTime.now()
)
