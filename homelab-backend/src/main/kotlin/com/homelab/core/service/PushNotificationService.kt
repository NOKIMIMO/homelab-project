package com.homelab.core.service

import com.fasterxml.jackson.module.kotlin.jacksonObjectMapper
import com.homelab.core.model.alert.AlertEvent
import com.homelab.sdk.helper.AppLogger
import java.net.URI
import java.net.http.HttpClient
import java.net.http.HttpRequest
import java.net.http.HttpResponse
import java.time.Duration
import org.springframework.stereotype.Service

@Service
class PushNotificationService(
    private val deviceRegistrationService: DeviceRegistrationService
) {
    private val log = AppLogger.loggerFor(PushNotificationService::class)
    private val mapper = jacksonObjectMapper()
    private val httpClient = HttpClient.newBuilder()
        .connectTimeout(Duration.ofSeconds(5))
        .build()

    fun notifyDevices(event: AlertEvent) {
        val endpoints = deviceRegistrationService.getAllEndpoints()
        if (endpoints.isEmpty()) return

        val payload = mapOf(
            "title" to "Alerte ${event.severity}: ${event.ruleName}",
            "body" to "${event.metric} ${event.operator} ${event.threshold} (valeur: ${event.triggerValue})",
            "severity" to event.severity.name,
            "metric" to event.metric.name,
            "triggerValue" to event.triggerValue,
            "threshold" to event.threshold,
            "ruleId" to event.ruleId,
            "ruleName" to event.ruleName,
            "triggeredAt" to event.triggeredAt.toString()
        )
        val body = mapper.writeValueAsString(payload)

        for (endpoint in endpoints) {
            try {
                val request = HttpRequest.newBuilder()
                    .uri(URI.create(endpoint))
                    .timeout(Duration.ofSeconds(10))
                    .header("Content-Type", "application/json")
                    .POST(HttpRequest.BodyPublishers.ofString(body))
                    .build()
                val response = httpClient.send(request, HttpResponse.BodyHandlers.discarding())
                if (response.statusCode() !in 200..299) {
                    log.warn("Push to device endpoint returned HTTP ${response.statusCode()}")
                }
            } catch (e: Exception) {
                log.warn("Failed to deliver push notification to a device endpoint: ${e.message}")
            }
        }
    }
}
