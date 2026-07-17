package com.homelab.core.model.action

import com.homelab.core.service.GlobalParametersService
import com.homelab.sdk.data.GenericTableLayer
import org.junit.jupiter.api.Assertions.assertEquals
import org.junit.jupiter.api.Test
import org.mockito.Mockito.mock
import org.mockito.Mockito.`when`

class FetchExternalActionTest {

    @Test
    fun `execute returns an error when the city parameter is missing`() {
        val globalParametersService = mock(GlobalParametersService::class.java)
        val genericObject = mock(GenericTableLayer::class.java)

        val result = FetchExternalAction(globalParametersService).execute(
            "weather", emptyMap(), genericObject, testDeclaration()
        )

        assertEquals(mapOf("error" to "Missing 'city' parameter"), result)
    }

    @Test
    fun `execute returns an error when baseUrl is not configured`() {
        val globalParametersService = mock(GlobalParametersService::class.java)
        `when`(globalParametersService.getParam("weather", "baseUrl")).thenReturn(null)
        val genericObject = mock(GenericTableLayer::class.java)

        val result = FetchExternalAction(globalParametersService).execute(
            "weather", mapOf("city" to "Paris"), genericObject, testDeclaration()
        )

        assertEquals(mapOf("error" to "'baseUrl' parameter not configured (open the module settings)"), result)
    }

    @Test
    fun `execute returns an error when apiKey is not configured`() {
        val globalParametersService = mock(GlobalParametersService::class.java)
        `when`(globalParametersService.getParam("weather", "baseUrl")).thenReturn("https://api.example.com")
        `when`(globalParametersService.getParam("weather", "apiKey")).thenReturn(null)
        val genericObject = mock(GenericTableLayer::class.java)

        val result = FetchExternalAction(globalParametersService).execute(
            "weather", mapOf("city" to "Paris"), genericObject, testDeclaration()
        )

        assertEquals(mapOf("error" to "'apiKey' parameter not configured (open the module settings)"), result)
    }
}
