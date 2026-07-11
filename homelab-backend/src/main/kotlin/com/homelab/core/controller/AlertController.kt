package com.homelab.core.controller

import com.homelab.core.api.dto.AlertRuleRequest
import com.homelab.core.model.alert.AlertEvent
import com.homelab.core.model.alert.AlertRule
import com.homelab.core.service.AlertService
import org.springframework.http.ResponseEntity
import org.springframework.security.access.prepost.PreAuthorize
import org.springframework.web.bind.annotation.*

@RestController
@RequestMapping("/api/admin/alerts")
@PreAuthorize("hasRole('ADMIN')")
@CrossOrigin(origins = ["*"])
class AlertController(private val alertService: AlertService) {

    @GetMapping
    fun getRules(): List<AlertRule> = alertService.getAllRules()

    @PostMapping
    fun createRule(@RequestBody body: AlertRuleRequest): AlertRule =
        alertService.createRule(body.name, body.metric, body.operator, body.threshold, body.severity, body.enabled)

    @PutMapping("/{id}")
    fun updateRule(@PathVariable id: Long, @RequestBody body: AlertRuleRequest): AlertRule =
        alertService.updateRule(id, body.name, body.metric, body.operator, body.threshold, body.severity, body.enabled)

    @PutMapping("/{id}/enabled/{enabled}")
    fun setEnabled(@PathVariable id: Long, @PathVariable enabled: Boolean): AlertRule =
        alertService.setEnabled(id, enabled)

    @DeleteMapping("/{id}")
    fun deleteRule(@PathVariable id: Long): ResponseEntity<Void> {
        alertService.deleteRule(id)
        return ResponseEntity.ok().build()
    }

    @GetMapping("/events")
    fun getEvents(@RequestParam(required = false, defaultValue = "100") limit: Int): List<AlertEvent> =
        alertService.getRecentEvents(limit)
}
