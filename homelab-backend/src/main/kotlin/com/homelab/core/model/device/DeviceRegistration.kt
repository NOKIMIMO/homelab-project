package com.homelab.core.model.device

import jakarta.persistence.*
import java.time.LocalDateTime

@Entity
@Table(name = "device_registrations")
class DeviceRegistration(
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    val id: Long? = null,

    @Column(nullable = false)
    var userId: Long,

    @Column(nullable = false, unique = true, length = 2048)
    var endpointUrl: String,

    @Column(nullable = true)
    var label: String? = null,

    @Column(nullable = false)
    val createdAt: LocalDateTime = LocalDateTime.now(),

    @Column(nullable = false)
    var lastUsedAt: LocalDateTime = LocalDateTime.now()
)
