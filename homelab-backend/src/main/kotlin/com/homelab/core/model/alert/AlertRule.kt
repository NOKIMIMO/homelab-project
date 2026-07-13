package com.homelab.core.model.alert

import jakarta.persistence.*
import java.time.LocalDateTime

/** A user-defined alert: watch [metric] and raise an event when it [operator]-crosses [threshold]. */
@Entity
@Table(name = "alert_rules")
class AlertRule(
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    val id: Long? = null,

    @Column(nullable = false, length = 200)
    var name: String,

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 32)
    var metric: MetricType,

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 16)
    var operator: AlertOperator,

    @Column(nullable = false)
    var threshold: Double,

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 16)
    var severity: AlertSeverity,

    @Column(nullable = false)
    var enabled: Boolean = true,

    @Column(nullable = false)
    val createdAt: LocalDateTime = LocalDateTime.now(),

    @Column(nullable = false)
    var updatedAt: LocalDateTime = LocalDateTime.now(),
)
