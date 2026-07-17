package com.homelab.core.api.dto.alert

import com.homelab.core.model.alert.AlertEvent
import com.homelab.core.model.alert.AlertOperator
import com.homelab.core.model.alert.AlertRule
import com.homelab.core.model.alert.AlertSeverity
import com.homelab.core.model.alert.AlertSource
import com.homelab.core.model.alert.MetricType
import java.time.LocalDateTime

/** Create/update payload sent by the admin front. Enums are deserialized from their names. */
data class AlertRuleRequest(
    val name: String = "",
    val metric: MetricType,
    val operator: AlertOperator,
    val threshold: Double,
    val severity: AlertSeverity,
    val enabled: Boolean = true,
)

data class AlertRuleDto(
    val id: Long?,
    val name: String,
    val metric: MetricType,
    val operator: AlertOperator,
    val operatorSymbol: String,
    val threshold: Double,
    val severity: AlertSeverity,
    val enabled: Boolean,
    val createdAt: LocalDateTime,
    val updatedAt: LocalDateTime,
)

fun AlertRule.toDto() = AlertRuleDto(
    id = id,
    name = name,
    metric = metric,
    operator = operator,
    operatorSymbol = operator.symbol,
    threshold = threshold,
    severity = severity,
    enabled = enabled,
    createdAt = createdAt,
    updatedAt = updatedAt,
)

data class AlertEventDto(
    val id: Long?,
    val source: AlertSource,
    val ruleId: Long?,
    val ruleName: String,
    val metric: MetricType?,
    val severity: AlertSeverity,
    val threshold: Double,
    val value: Double,
    val message: String,
    val triggeredAt: LocalDateTime,
)

fun AlertEvent.toDto() = AlertEventDto(
    id = id,
    source = source,
    ruleId = ruleId,
    ruleName = ruleName,
    metric = metric,
    severity = severity,
    threshold = threshold,
    value = value,
    message = message,
    triggeredAt = triggeredAt,
)
