package com.homelab.core.model.alert

import jakarta.persistence.*
import java.time.LocalDateTime

/**
 * An occurrence delivered to the mobile app as a device notification. Originally metric-only; now
 * the single delivery pipeline also carries account-validation and server-error notifications (see
 * [source]). For [AlertSource.RULE] events the rule name/metric/severity/threshold are snapshotted
 * so the event stays meaningful even if the rule is later edited or deleted; for the other sources
 * [metric]/[threshold]/[value] are not applicable ([metric] is null, the numbers stay 0).
 *
 * Consumed by the mobile app via [com.homelab.core.controller.AlertController.stream] (live SSE) and
 * [com.homelab.core.controller.AlertController.events] (catch-up on reconnect).
 *
 * NB: [metric] is nullable. On a database created before this change its column may still carry a
 * NOT NULL constraint (Hibernate `ddl-auto=update` never relaxes it); drop that constraint — or the
 * throwaway `alert_events` table — if you hit an insert error on a non-metric event.
 */
@Entity
@Table(name = "alert_events")
class AlertEvent(
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    val id: Long? = null,

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 16)
    val source: AlertSource = AlertSource.RULE,

    @Column(nullable = true)
    val ruleId: Long? = null,

    @Column(nullable = false, length = 200)
    val ruleName: String,

    @Enumerated(EnumType.STRING)
    @Column(nullable = true, length = 32)
    val metric: MetricType? = null,

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 16)
    val severity: AlertSeverity,

    @Column(nullable = false)
    val threshold: Double = 0.0,

    @Column(nullable = false)
    val value: Double = 0.0,

    @Column(nullable = false, length = 500)
    val message: String,

    @Column(nullable = false)
    val triggeredAt: LocalDateTime = LocalDateTime.now(),
)
