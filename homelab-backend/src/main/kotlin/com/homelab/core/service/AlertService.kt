package com.homelab.core.service

import com.homelab.core.api.dto.alert.AlertRuleRequest
import com.homelab.core.exception.BadRequestException
import com.homelab.core.exception.NotFoundException
import com.homelab.core.model.alert.AlertEvent
import com.homelab.core.model.alert.AlertEventRepository
import com.homelab.core.model.alert.AlertRule
import com.homelab.core.model.alert.AlertRuleRepository
import com.homelab.core.model.alert.MetricType
import com.homelab.core.model.telemetry.TelemetryData
import com.homelab.sdk.helper.AppLogger
import com.homelab.sdk.helper.Formater
import java.time.LocalDateTime
import java.util.concurrent.ConcurrentHashMap
import org.springframework.scheduling.annotation.Scheduled
import org.springframework.stereotype.Service

/**
 * Manages user-defined alert rules and turns telemetry into [AlertEvent]s.
 *
 * Evaluation is edge-triggered: an event is emitted only on the transition from "not firing" to
 * "firing" for a given rule, so a metric staying above its threshold produces one event, not one
 * every evaluation tick. When the metric falls back the rule re-arms and can fire again later.
 */
@Service
class AlertService(
    private val ruleRepository: AlertRuleRepository,
    private val eventRepository: AlertEventRepository,
    private val telemetryService: TelemetryService,
) {
    private val log = AppLogger.loggerFor(AlertService::class)

    /** Ids of rules currently in the "firing" state (rising-edge de-duplication). */
    private val firing = ConcurrentHashMap.newKeySet<Long>()

    // ---------------------------------------------------------------- Rules CRUD

    fun listRules(): List<AlertRule> = ruleRepository.findAll()

    fun createRule(req: AlertRuleRequest): AlertRule {
        val rule = AlertRule(
            name = req.validatedName(),
            metric = req.metric,
            operator = req.operator,
            threshold = req.validatedThreshold(),
            severity = req.severity,
            enabled = req.enabled,
        )
        return ruleRepository.save(rule)
    }

    fun updateRule(id: Long, req: AlertRuleRequest): AlertRule {
        val rule = ruleRepository.findById(id).orElseThrow { NotFoundException("Alerte introuvable: $id") }
        rule.name = req.validatedName()
        rule.metric = req.metric
        rule.operator = req.operator
        rule.threshold = req.validatedThreshold()
        rule.severity = req.severity
        rule.enabled = req.enabled
        rule.updatedAt = LocalDateTime.now()
        // Editing (esp. disabling) re-arms the rule so a fresh crossing is needed to fire again.
        firing.remove(id)
        return ruleRepository.save(rule)
    }

    fun deleteRule(id: Long) {
        if (!ruleRepository.existsById(id)) throw NotFoundException("Alerte introuvable: $id")
        ruleRepository.deleteById(id)
        firing.remove(id)
    }

    // ---------------------------------------------------------------- Events

    fun eventsSince(since: LocalDateTime?): List<AlertEvent> =
        if (since != null) eventRepository.findByTriggeredAtAfterOrderByTriggeredAtDesc(since)
        else eventRepository.findTop100ByOrderByTriggeredAtDesc()

    // ---------------------------------------------------------------- Evaluation loop

    @Scheduled(fixedRate = 15000)
    fun evaluate() {
        val telemetry = telemetryService.getTelemetry() ?: return
        for (rule in ruleRepository.findAll()) {
            val id = rule.id ?: continue
            if (!rule.enabled) {
                firing.remove(id)
                continue
            }
            val value = metricPercent(rule.metric, telemetry) ?: continue
            if (rule.operator.test(value, rule.threshold)) {
                // Rising edge only: add() returns true the first time the id enters the set.
                if (firing.add(id)) persistEvent(rule, value)
            } else {
                firing.remove(id)
            }
        }
    }

    /** Resolves the current 0-100 percentage for a metric, or null if it can't be computed. */
    private fun metricPercent(metric: MetricType, t: TelemetryData): Double? = when (metric) {
        MetricType.CPU -> t.cpu
        MetricType.RAM -> if (t.ram.total > 0) t.ram.used / t.ram.total * 100.0 else null
        MetricType.DISK -> if (t.disk.total > 0) t.disk.used / t.disk.total * 100.0 else null
    }

    private fun persistEvent(rule: AlertRule, value: Double) {
        val rounded = Formater.round(value, 1)
        val message = "${rule.metric.label} à $rounded${rule.metric.unit} " +
            "(seuil ${rule.operator.symbol} ${rule.threshold}${rule.metric.unit})"
        eventRepository.save(
            AlertEvent(
                ruleId = rule.id,
                ruleName = rule.name,
                metric = rule.metric,
                severity = rule.severity,
                threshold = rule.threshold,
                value = rounded,
                message = message,
            )
        )
        log.info("Alerte '${rule.name}' [${rule.severity}] déclenchée: $message")
    }

    // ---------------------------------------------------------------- Validation

    private fun AlertRuleRequest.validatedName(): String =
        name.trim().ifBlank { throw BadRequestException("Le nom de l'alerte est requis") }

    private fun AlertRuleRequest.validatedThreshold(): Double {
        if (threshold < 0.0 || threshold > 100.0) {
            throw BadRequestException("Le seuil doit être compris entre 0 et 100 (%)")
        }
        return threshold
    }
}
