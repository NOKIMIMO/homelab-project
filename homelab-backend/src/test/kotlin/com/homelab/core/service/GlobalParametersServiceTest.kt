package com.homelab.core.service

import com.homelab.core.service.module.ModuleParamsService
import org.junit.jupiter.api.Assertions.assertEquals
import org.junit.jupiter.api.Assertions.assertNull
import org.junit.jupiter.api.Test
import org.mockito.Mockito.mock
import org.mockito.Mockito.`when`

class GlobalParametersServiceTest {

    private val moduleParamsService = mock(ModuleParamsService::class.java)
    private val service = GlobalParametersService(moduleParamsService)

    @Test
    fun `getParam returns the value for the given key`() {
        `when`(moduleParamsService.getRawValues("weather")).thenReturn(mapOf("apiKey" to "secret", "units" to null))

        assertEquals("secret", service.getParam("weather", "apiKey"))
        assertNull(service.getParam("weather", "units"))
        assertNull(service.getParam("weather", "missing"))
    }

    @Test
    fun `getAllParams returns the full raw values map`() {
        val values = mapOf("apiKey" to "secret", "baseUrl" to "https://api.example.com")
        `when`(moduleParamsService.getRawValues("weather")).thenReturn(values)

        assertEquals(values, service.getAllParams("weather"))
    }
}
