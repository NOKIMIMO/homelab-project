package com.homelab.core.controller

import com.homelab.core.api.dto.alert.AlertRuleRequest
import com.homelab.core.api.dto.alert.toDto
import com.homelab.core.exception.BadRequestException
import com.homelab.core.model.alert.AlertOperator
import com.homelab.core.model.alert.AlertSeverity
import com.homelab.core.model.alert.MetricType
import com.homelab.core.service.AlertService
import com.homelab.core.service.AlertStreamService
import java.time.LocalDateTime
import org.springframework.http.MediaType
import org.springframework.http.ResponseEntity
import org.springframework.security.access.prepost.PreAuthorize
import org.springframework.web.bind.annotation.*
import org.springframework.web.servlet.mvc.method.annotation.SseEmitter

@RestController
@RequestMapping("/api/alerts")
@CrossOrigin(origins = ["*"])
class AlertController(
    private val alertService: AlertService,
    private val alertStreamService: AlertStreamService,
) {

    // ----- Rule management (admin only) -----
    // "Admin" here means full admins and ADMIN_ACCESS holders alike, matching the rest of the admin
    // panel: configuring alert rules is an ordinary admin-panel task that never touches the
    // administrator account.

    @PreAuthorize("hasRole('ADMIN') or @permissionService.currentUserHasAdminPermission('ADMIN_ACCESS')")
    @GetMapping("/rules")
    fun listRules() = alertService.listRules().map { it.toDto() }

    @PreAuthorize("hasRole('ADMIN') or @permissionService.currentUserHasAdminPermission('ADMIN_ACCESS')")
    @PostMapping("/rules")
    fun createRule(@RequestBody req: AlertRuleRequest) = alertService.createRule(req).toDto()

    @PreAuthorize("hasRole('ADMIN') or @permissionService.currentUserHasAdminPermission('ADMIN_ACCESS')")
    @PutMapping("/rules/{id}")
    fun updateRule(@PathVariable id: Long, @RequestBody req: AlertRuleRequest) =
        alertService.updateRule(id, req).toDto()

    @PreAuthorize("hasRole('ADMIN') or @permissionService.currentUserHasAdminPermission('ADMIN_ACCESS')")
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
                throw BadRequestException("Invalid 'since' parameter (expected ISO-8601 format)")
            }
        }
        return mapOf(
            "serverTime" to LocalDateTime.now(),
            "events" to alertService.eventsSince(sinceDt).map { it.toDto() },
        )
    }

    /**
     * Opens a persistent Server-Sent Events stream that pushes alerts to the device in real time,
     * as they fire. Held open by the mobile app's foreground service; the app also catches up via
     * [events] on (re)connect for anything it missed while disconnected. Authenticated like the rest
     * of the /api space (the client sends its bearer token on the streaming request).
     */
    @GetMapping("/stream", produces = [MediaType.TEXT_EVENT_STREAM_VALUE])
    fun stream(): SseEmitter = alertStreamService.subscribe()
}
