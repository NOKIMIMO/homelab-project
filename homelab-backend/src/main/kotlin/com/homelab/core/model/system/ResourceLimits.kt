package com.homelab.core.model.system

import jakarta.persistence.*
import java.time.LocalDateTime

// Owner-configurable resource caps for the homelab (core app + modules). Single active row, like
// LoginSettings. maxRamGb is a target only - the JVM heap ceiling is fixed at process start, so
// it takes effect as -Xmx after a container restart. maxDiskGb is enforced live by
// ResourceLimitsService on every write path (module install, file upload).
@Entity
@Table(name = "resource_limits")
class ResourceLimits(
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    val id: Long? = null,

    @Column(nullable = false)
    var maxRamGb: Double = 2.0,

    @Column(nullable = false)
    var maxDiskGb: Double = 256.0,

    @Column(nullable = false)
    var updatedAt: LocalDateTime = LocalDateTime.now()
)
