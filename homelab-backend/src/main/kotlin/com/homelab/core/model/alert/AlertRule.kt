package com.homelab.core.model.alert

import jakarta.persistence.*
import java.time.LocalDateTime

@Entity
@Table(name = "alert_rules")
class AlertRule(
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    val id: Long? = null,

    @Column(nullable = false)
    var name: String = "",

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    var metric: AlertMetric = AlertMetric.CPU,

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    var operator: AlertOperator = AlertOperator.ABOVE,

    @Column(nullable = false)
    var threshold: Double = 0.0,

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    var severity: AlertSeverity = AlertSeverity.WARNING,

    @Column(nullable = false)
    var enabled: Boolean = true,

    @Column(nullable = false)
    val createdAt: LocalDateTime = LocalDateTime.now(),

    @Column(nullable = false)
    var updatedAt: LocalDateTime = LocalDateTime.now()
)
