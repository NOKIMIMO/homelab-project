package com.homelab.core.service

import com.homelab.core.exception.BadRequestException
import com.homelab.core.model.system.ResourceLimits
import com.homelab.core.model.system.ResourceLimitsRepository
import org.junit.jupiter.api.Assertions.assertDoesNotThrow
import org.junit.jupiter.api.Assertions.assertThrows
import org.junit.jupiter.api.BeforeEach
import org.junit.jupiter.api.Test
import org.mockito.Mockito.mock
import org.mockito.Mockito.`when`
import org.springframework.core.env.Environment

class ResourceLimitsServiceTest {

    private lateinit var repository: ResourceLimitsRepository
    private lateinit var env: Environment
    private lateinit var service: ResourceLimitsService

    @BeforeEach
    fun setUp() {
        repository = mock(ResourceLimitsRepository::class.java)
        env = mock(Environment::class.java)
        service = ResourceLimitsService(repository, env)
    }

    @Test
    fun `checkDiskQuota does not throw when the cap is far above real usage`() {
        `when`(repository.findAll()).thenReturn(listOf(ResourceLimits(maxDiskGb = 1_000_000.0)))

        assertDoesNotThrow { service.checkDiskQuota(100L) }
    }

    @Test
    fun `checkDiskQuota throws BadRequestException when the write would exceed a tiny cap`() {
        `when`(repository.findAll()).thenReturn(listOf(ResourceLimits(maxDiskGb = 0.000001)))

        assertThrows(BadRequestException::class.java) { service.checkDiskQuota(10_000_000L) }
    }

    @Test
    fun `updateLimits rejects a non-positive RAM limit`() {
        assertThrows(BadRequestException::class.java) { service.updateLimits(0.0, 10.0) }
    }

    @Test
    fun `updateLimits rejects a non-positive disk limit`() {
        assertThrows(BadRequestException::class.java) { service.updateLimits(1.0, -1.0) }
    }

    @Test
    fun `updateLimits rejects a RAM limit above the machine's capacity`() {
        assertThrows(BadRequestException::class.java) { service.updateLimits(Double.MAX_VALUE / 2, 10.0) }
    }
}
