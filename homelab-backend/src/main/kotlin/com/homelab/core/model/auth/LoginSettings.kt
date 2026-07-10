package com.homelab.core.model.auth

import jakarta.persistence.*
import java.time.LocalDateTime

@Entity
@Table(name = "login_settings")
class LoginSettings(
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    val id: Long? = null,

    @Column(nullable = true, length = 500)
    var description: String? = null,

    @Column(nullable = false)
    var updatedAt: LocalDateTime = LocalDateTime.now()
)
