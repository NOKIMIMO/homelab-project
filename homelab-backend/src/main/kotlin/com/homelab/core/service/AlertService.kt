package com.homelab.core.service

import com.homelab.core.exception.BadRequestException
import com.homelab.core.exception.NotFoundException
import com.homelab.core.model.alert.AlertEvent
import com.homelab.core.model.alert.AlertEventRepository
import com.homelab.core.model.alert.AlertMetric
import com.homelab.core.model.alert.AlertOperator
import com.homelab.core.model.alert.AlertRule
import com.homelab.core.model.alert.AlertRuleRepository
import com.homelab.core.model.alert.AlertSeverity
import com.homelab.core.model.telemetry.TelemetryData
import com.homelab.sdk.helper.AppLogger
import java.time.LocalDateTime
import org.springframework.data.domain.PageRequest
import org.springframework.scheduling.annotation.Scheduled
import org.springframework.stereotype.Service

@Service
class AlertService(
    private val ruleRepository: AlertRuleRepository,
    private val eventRepository: AlertEventRepository,
    private val telemetryService: TelemetryService,
    private val pushNotificationService: PushNotificationService,
) {
    private val log = AppLogger.loggerFor(AlertService::class)

    // ---- Rule CRUD ----

    fun getAllRules(): List<AlertRule> = ruleRepository.findAll()

    fun createRule(
        name: String,
        metric: AlertMetric,
        operator: AlertOperator,
        threshold: Double,
        severity: AlertSeverity,
        enabled: Boolean
    ): AlertRule {
        if (name.isBlank()) throw BadRequestException("Rule name is required")
        val rule = AlertRule(
            name = name,
            metric = metric,
            operator = operator,
            threshold = threshold,
            severity = severity,
            enabled = enabled
        )
        return ruleRepository.save(rule)
    }

    fun updateRule(
        id: Long,
        name: String,
        metric: AlertMetric,
        operator: AlertOperator,
        threshold: Double,
        severity: AlertSeverity,
        enabled: Boolean
    ): AlertRule {
        if (name.isBlank()) throw BadRequestException("Rule name is required")
        val rule = ruleRepository.findById(id).orElseThrow { NotFoundException("Alert rule '$id' not found") }
        rule.name = name
        rule.metric = metric
        rule.operator = operator
        rule.threshold = threshold
        rule.severity = severity
        rule.enabled = enabled
        rule.updatedAt = LocalDateTime.now()
        val saved = ruleRepository.save(rule)
        if (!enabled) resolveOpenEventsForRule(id)
        return saved
    }

    fun setEnabled(id: Long, enabled: Boolean): AlertRule {
        val rule = ruleRepository.findById(id).orElseThrow { NotFoundException("Alert rule '$id' not found") }
        rule.enabled = enabled
        rule.updatedAt = LocalDateTime.now()
        val saved = ruleRepository.save(rule)
        if (!enabled) resolveOpenEventsForRule(id)
        return saved
    }

    fun deleteRule(id: Long) {
        if (!ruleRepository.existsById(id)) throw NotFoundException("Alert rule '$id' not found")
        resolveOpenEventsForRule(id)
        ruleRepository.deleteById(id)
    }

    // ---- Event history ----

    fun getRecentEvents(limit: Int): List<AlertEvent> =
        eventRepository.findAllByOrderByTriggeredAtDesc(PageRequest.of(0, limit.coerceIn(1, 500)))

    // ---- Evaluation ----

    @Scheduled(fixedRate = 10000)
    fun evaluateRules() {
        val telemetry = telemetryService.getTelemetry() ?: return
        val enabledRules = ruleRepository.findByEnabledTrue()
        for (rule in enabledRules) {
            try {
                evaluateRule(rule, telemetry)
            } catch (e: Exception) {
                log.error("Failed evaluating alert rule '${rule.id}': ${e.message}", e)
            }
        }
    }

    private fun evaluateRule(rule: AlertRule, telemetry: TelemetryData) {
        val ruleId = rule.id ?: return
        val value = metricValue(rule.metric, telemetry)
        val breached = when (rule.operator) {
            AlertOperator.ABOVE -> value > rule.threshold
            AlertOperator.BELOW -> value < rule.threshold
        }
        val openEvent = eventRepository.findFirstByRuleIdAndResolvedFalse(ruleId)

        if (breached) {
            if (openEvent.isEmpty) {
                val saved = eventRepository.save(
                    AlertEvent(
                        ruleId = ruleId,
                        ruleName = rule.name,
                        metric = rule.metric,
                        operator = rule.operator,
                        threshold = rule.threshold,
                        severity = rule.severity,
                        triggerValue = value
                    )
                )
                pushNotificationService.notifyDevices(saved)
            }
        } else {
            openEvent.ifPresent { ev ->
                ev.resolved = true
                ev.resolvedAt = LocalDateTime.now()
                eventRepository.save(ev)
            }
        }
    }

    private fun metricValue(metric: AlertMetric, t: TelemetryData): Double = when (metric) {
        AlertMetric.CPU -> t.cpu
        AlertMetric.RAM -> if (t.ram.total > 0) t.ram.used / t.ram.total * 100.0 else 0.0
        AlertMetric.DISK -> if (t.disk.total > 0) t.disk.used / t.disk.total * 100.0 else 0.0
        AlertMetric.ACTIVE_MODULES -> t.activeModulesCount.toDouble()
    }

    private fun resolveOpenEventsForRule(ruleId: Long) {
        eventRepository.findAllByRuleIdAndResolvedFalse(ruleId).forEach { ev ->
            ev.resolved = true
            ev.resolvedAt = LocalDateTime.now()
            eventRepository.save(ev)
        }
    }
}
