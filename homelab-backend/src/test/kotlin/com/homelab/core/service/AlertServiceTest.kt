package com.homelab.core.service

import com.homelab.core.api.dto.alert.AlertRuleRequest
import com.homelab.core.exception.BadRequestException
import com.homelab.core.exception.NotFoundException
import com.homelab.core.model.alert.AlertEvent
import com.homelab.core.model.alert.AlertEventRepository
import com.homelab.core.model.alert.AlertOperator
import com.homelab.core.model.alert.AlertRule
import com.homelab.core.model.alert.AlertRuleRepository
import com.homelab.core.model.alert.AlertSeverity
import com.homelab.core.model.alert.MetricType
import com.homelab.core.model.telemetry.CpuData
import com.homelab.core.model.telemetry.DiskData
import com.homelab.core.model.telemetry.RamData
import com.homelab.core.model.telemetry.TelemetryData
import org.junit.jupiter.api.Assertions.assertEquals
import org.junit.jupiter.api.Assertions.assertThrows
import org.junit.jupiter.api.Assertions.assertTrue
import org.junit.jupiter.api.BeforeEach
import org.junit.jupiter.api.Test
import org.mockito.ArgumentCaptor
import org.mockito.Mockito.mock
import org.mockito.Mockito.never
import org.mockito.Mockito.times
import org.mockito.Mockito.verify
import org.mockito.Mockito.`when`
import org.mockito.kotlin.any

class AlertServiceTest {

    private lateinit var ruleRepository: AlertRuleRepository
    private lateinit var eventRepository: AlertEventRepository
    private lateinit var telemetryService: TelemetryService
    private lateinit var service: AlertService

    @BeforeEach
    fun setUp() {
        ruleRepository = mock(AlertRuleRepository::class.java)
        eventRepository = mock(AlertEventRepository::class.java)
        telemetryService = mock(TelemetryService::class.java)
        service = AlertService(ruleRepository, eventRepository, telemetryService)
    }

    private fun telemetry(cpu: Double = 0.0, ramUsed: Double = 0.0, ramTotal: Double = 100.0) = TelemetryData(
        cpu = CpuData(total = cpu, coreUsed = 0.0),
        ram = RamData(total = ramTotal, used = ramUsed, coreUsed = 0.0, modulesUsed = 0.0),
        disk = DiskData(total = 100.0, used = 0.0, coreStorageUsed = 0.0, modulesStorageUsed = 0.0),
        activeModulesCount = 0,
        uptime = 0,
        perModuleStorage = emptyList()
    )

    private fun rule(
        id: Long = 1L,
        metric: MetricType = MetricType.CPU,
        operator: AlertOperator = AlertOperator.GT,
        threshold: Double = 90.0,
        enabled: Boolean = true
    ) = mock(AlertRule::class.java).also {
        `when`(it.id).thenReturn(id)
        `when`(it.metric).thenReturn(metric)
        `when`(it.operator).thenReturn(operator)
        `when`(it.threshold).thenReturn(threshold)
        `when`(it.enabled).thenReturn(enabled)
        `when`(it.name).thenReturn("cpu-rule")
        `when`(it.severity).thenReturn(AlertSeverity.HIGH)
    }

    @Test
    fun `evaluate does nothing when telemetry is not yet available`() {
        `when`(telemetryService.getTelemetry()).thenReturn(null)

        service.evaluate()

        verify(ruleRepository, never()).findAll()
    }

    @Test
    fun `evaluate persists an event the first time a rule crosses its threshold`() {
        val theRule = rule(threshold = 90.0)
        `when`(telemetryService.getTelemetry()).thenReturn(telemetry(cpu = 95.0))
        `when`(ruleRepository.findAll()).thenReturn(listOf(theRule))

        service.evaluate()

        val captor = ArgumentCaptor.forClass(AlertEvent::class.java)
        verify(eventRepository, times(1)).save(captor.capture())
        assertEquals(95.0, captor.value.value)
        assertEquals(MetricType.CPU, captor.value.metric)
    }

    @Test
    fun `evaluate does not re-fire on consecutive ticks while still above threshold`() {
        val theRule = rule(threshold = 90.0)
        `when`(telemetryService.getTelemetry()).thenReturn(telemetry(cpu = 95.0))
        `when`(ruleRepository.findAll()).thenReturn(listOf(theRule))

        service.evaluate()
        service.evaluate()

        verify(eventRepository, times(1)).save(any<AlertEvent>())
    }

    @Test
    fun `evaluate re-fires after the metric drops back below threshold and rises again`() {
        val theRule = rule(threshold = 90.0)
        `when`(ruleRepository.findAll()).thenReturn(listOf(theRule))

        `when`(telemetryService.getTelemetry()).thenReturn(telemetry(cpu = 95.0))
        service.evaluate()
        `when`(telemetryService.getTelemetry()).thenReturn(telemetry(cpu = 50.0))
        service.evaluate()
        `when`(telemetryService.getTelemetry()).thenReturn(telemetry(cpu = 95.0))
        service.evaluate()

        verify(eventRepository, times(2)).save(any<AlertEvent>())
    }

    @Test
    fun `evaluate skips disabled rules`() {
        val theRule = rule(threshold = 90.0, enabled = false)
        `when`(telemetryService.getTelemetry()).thenReturn(telemetry(cpu = 95.0))
        `when`(ruleRepository.findAll()).thenReturn(listOf(theRule))

        service.evaluate()

        verify(eventRepository, never()).save(any<AlertEvent>())
    }

    @Test
    fun `evaluate skips RAM and DISK metrics when totals are zero to avoid division by zero`() {
        `when`(telemetryService.getTelemetry()).thenReturn(
            TelemetryData(
                cpu = CpuData(0.0, 0.0),
                ram = RamData(total = 0.0, used = 0.0, coreUsed = 0.0, modulesUsed = 0.0),
                disk = DiskData(total = 0.0, used = 0.0, coreStorageUsed = 0.0, modulesStorageUsed = 0.0),
                activeModulesCount = 0,
                uptime = 0,
                perModuleStorage = emptyList()
            )
        )
        val theRule = rule(metric = MetricType.RAM, operator = AlertOperator.GTE, threshold = 0.0)
        `when`(ruleRepository.findAll()).thenReturn(listOf(theRule))

        service.evaluate()

        verify(eventRepository, never()).save(any<AlertEvent>())
    }

    @Test
    fun `createRule rejects a blank name`() {
        val request = AlertRuleRequest(name = "  ", metric = MetricType.CPU, operator = AlertOperator.GT, threshold = 50.0, severity = AlertSeverity.LOW)

        assertThrows(BadRequestException::class.java) { service.createRule(request) }
    }

    @Test
    fun `createRule rejects a threshold outside 0 to 100`() {
        val request = AlertRuleRequest(name = "cpu", metric = MetricType.CPU, operator = AlertOperator.GT, threshold = 150.0, severity = AlertSeverity.LOW)

        assertThrows(BadRequestException::class.java) { service.createRule(request) }
    }

    @Test
    fun `createRule saves a valid rule`() {
        val request = AlertRuleRequest(name = " cpu-rule ", metric = MetricType.CPU, operator = AlertOperator.GT, threshold = 80.0, severity = AlertSeverity.LOW)
        `when`(ruleRepository.save(any<AlertRule>())).thenAnswer { it.arguments[0] }

        val saved = service.createRule(request)

        assertEquals("cpu-rule", saved.name)
        assertEquals(80.0, saved.threshold)
    }

    @Test
    fun `deleteRule throws NotFoundException when the rule does not exist`() {
        `when`(ruleRepository.existsById(5L)).thenReturn(false)

        assertThrows(NotFoundException::class.java) { service.deleteRule(5L) }
    }

    @Test
    fun `eventsSince without a cutoff returns the latest 100 events`() {
        `when`(eventRepository.findTop100ByOrderByTriggeredAtDesc()).thenReturn(emptyList())

        service.eventsSince(null)

        verify(eventRepository).findTop100ByOrderByTriggeredAtDesc()
    }
}
