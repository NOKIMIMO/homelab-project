package com.homelab.core.controller

import com.homelab.core.api.dto.alert.AlertRuleRequest
import com.homelab.core.api.dto.alert.toDto
import com.homelab.core.exception.BadRequestException
import com.homelab.core.model.alert.AlertOperator
import com.homelab.core.model.alert.AlertSeverity
import com.homelab.core.model.alert.MetricType
import com.homelab.core.service.AlertService
import java.time.LocalDateTime
import org.springframework.http.ResponseEntity
import org.springframework.security.access.prepost.PreAuthorize
import org.springframework.web.bind.annotation.*

@RestController
@RequestMapping("/api/alerts")
@CrossOrigin(origins = ["*"])
class AlertController(private val alertService: AlertService) {

    // ----- Rule management (admin only) -----

    @PreAuthorize("hasRole('ADMIN')")
    @GetMapping("/rules")
    fun listRules() = alertService.listRules().map { it.toDto() }

    @PreAuthorize("hasRole('ADMIN')")
    @PostMapping("/rules")
    fun createRule(@RequestBody req: AlertRuleRequest) = alertService.createRule(req).toDto()

    @PreAuthorize("hasRole('ADMIN')")
    @PutMapping("/rules/{id}")
    fun updateRule(@PathVariable id: Long, @RequestBody req: AlertRuleRequest) =
        alertService.updateRule(id, req).toDto()

    @PreAuthorize("hasRole('ADMIN')")
    @DeleteMapping("/rules/{id}")
    fun deleteRule(@PathVariable id: Long): ResponseEntity<Void> {
        alertService.deleteRule(id)
        return ResponseEntity.ok().build()
    }

    /** Enum options that drive the front's dropdowns (kept server-authoritative). */
    @GetMapping("/options")
    fun options(): Map<String, Any> = mapOf(
        "metrics" to MetricType.values().map {
            mapOf("name" to it.name, "label" to it.label, "unit" to it.unit)
        },
        "operators" to AlertOperator.values().map {
            mapOf("name" to it.name, "symbol" to it.symbol)
        },
        "severities" to AlertSeverity.values().map { it.name },
    )

    // ----- Events (any authenticated client, e.g. the mobile app polling each minute) -----

    /**
     * Returns events triggered after [since] (ISO-8601 local date-time), newest first, plus the
     * current server time. Clients should store `serverTime` and pass it back as the next `since`
     * to page incrementally without relying on their own clock.
     */
    @GetMapping("/events")
    fun events(@RequestParam(required = false) since: String?): Map<String, Any> {
        val sinceDt = since?.let {
            runCatching { LocalDateTime.parse(it) }.getOrElse {
                throw BadRequestException("Paramètre 'since' invalide (format ISO-8601 attendu)")
            }
        }
        return mapOf(
            "serverTime" to LocalDateTime.now(),
            "events" to alertService.eventsSince(sinceDt).map { it.toDto() },
        )
    }
}
