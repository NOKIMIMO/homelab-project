package com.homelab.core.model.alert

import jakarta.persistence.*
import java.time.LocalDateTime

/**
 * An occurrence produced when a rule fires. Rule name/metric/severity/threshold are snapshotted so
 * the event stays meaningful even if the rule is later edited or deleted. Consumed by the mobile app
 * which polls [com.homelab.core.controller.AlertController.events] to raise device notifications.
 */
@Entity
@Table(name = "alert_events")
class AlertEvent(
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    val id: Long? = null,

    @Column(nullable = true)
    val ruleId: Long? = null,

    @Column(nullable = false, length = 200)
    val ruleName: String,

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 32)
    val metric: MetricType,

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 16)
    val severity: AlertSeverity,

    @Column(nullable = false)
    val threshold: Double,

    @Column(nullable = false)
    val value: Double,

    @Column(nullable = false, length = 500)
    val message: String,

    @Column(nullable = false)
    val triggeredAt: LocalDateTime = LocalDateTime.now(),
)
