package com.homelab.core.model.alert

import jakarta.persistence.*
import java.time.LocalDateTime

@Entity
@Table(name = "alert_events")
class AlertEvent(
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    val id: Long? = null,

    @Column(nullable = false)
    val ruleId: Long,

    @Column(nullable = false)
    val ruleName: String,

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    val metric: AlertMetric,

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    val operator: AlertOperator,

    @Column(nullable = false)
    val threshold: Double,

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    val severity: AlertSeverity,

    @Column(nullable = false)
    val triggerValue: Double,

    @Column(nullable = false)
    val triggeredAt: LocalDateTime = LocalDateTime.now(),

    @Column(nullable = false)
    var resolved: Boolean = false,

    @Column(nullable = true)
    var resolvedAt: LocalDateTime? = null
)
