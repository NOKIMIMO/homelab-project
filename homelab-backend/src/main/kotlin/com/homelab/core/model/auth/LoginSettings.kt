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

    // Displayed as the browser tab title (falls back to a default when unset).
    @Column(nullable = true, length = 100)
    var appName: String? = null,

    // File name of the uploaded image stored on disk (storage/branding/, see HomelabConfig.storagePath), rendered as the
    // browser tab favicon. Falls back to the default favicon when unset.
    @Column(nullable = true, length = 255)
    var appIcon: String? = null,

    @Column(nullable = false)
    var updatedAt: LocalDateTime = LocalDateTime.now()
)
