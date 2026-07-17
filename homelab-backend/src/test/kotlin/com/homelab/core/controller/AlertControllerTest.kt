package com.homelab.core.controller

import com.homelab.core.exception.BadRequestException
import com.homelab.core.model.alert.AlertOperator
import com.homelab.core.model.alert.AlertSeverity
import com.homelab.core.model.alert.MetricType
import com.homelab.core.service.AlertService
import com.homelab.core.service.AlertStreamService
import org.junit.jupiter.api.Assertions.assertEquals
import org.junit.jupiter.api.Assertions.assertThrows
import org.junit.jupiter.api.BeforeEach
import org.junit.jupiter.api.Test
import org.mockito.Mockito.mock
import org.mockito.Mockito.verify
import org.mockito.Mockito.`when`
import java.time.LocalDateTime

class AlertControllerTest {

    private lateinit var alertService: AlertService
    private lateinit var alertStreamService: AlertStreamService
    private lateinit var controller: AlertController

    @BeforeEach
    fun setUp() {
        alertService = mock(AlertService::class.java)
        alertStreamService = mock(AlertStreamService::class.java)
        controller = AlertController(alertService, alertStreamService)
    }

    @Test
    fun `options exposes every metric operator and severity as server-authoritative dropdown data`() {
        val options = controller.options()

        @Suppress("UNCHECKED_CAST")
        val metrics = options["metrics"] as List<Map<String, String>>
        assertEquals(MetricType.entries.map { it.name }, metrics.map { it["name"] })

        @Suppress("UNCHECKED_CAST")
        val operators = options["operators"] as List<Map<String, String>>
        assertEquals(AlertOperator.entries.map { it.symbol }, operators.map { it["symbol"] })

        assertEquals(AlertSeverity.entries.map { it.name }, options["severities"])
    }

    @Test
    fun `events with no since parameter passes null through to the service`() {
        `when`(alertService.eventsSince(null)).thenReturn(emptyList())

        val result = controller.events(null)

        assertEquals(emptyList<Any>(), result["events"])
        verify(alertService).eventsSince(null)
    }

    @Test
    fun `events parses a valid ISO-8601 since parameter`() {
        val since = LocalDateTime.of(2026, 7, 1, 10, 0)
        `when`(alertService.eventsSince(since)).thenReturn(emptyList())

        controller.events(since.toString())

        verify(alertService).eventsSince(since)
    }

    @Test
    fun `events rejects a malformed since parameter`() {
        assertThrows(BadRequestException::class.java) { controller.events("not-a-date") }
    }
}
