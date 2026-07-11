package com.homelab.core.api.dto

import com.homelab.core.model.alert.AlertMetric
import com.homelab.core.model.alert.AlertOperator
import com.homelab.core.model.alert.AlertSeverity

data class AlertRuleRequest(
    val name: String,
    val metric: AlertMetric,
    val operator: AlertOperator,
    val threshold: Double,
    val severity: AlertSeverity,
    val enabled: Boolean = true
)
