package com.homelab.core.model.action

import com.homelab.core.service.GlobalParametersService
import com.homelab.sdk.data.GenericTableLayer
import com.homelab.sdk.module.action.ModuleActionLogic
import org.junit.jupiter.api.Assertions.assertEquals
import org.junit.jupiter.api.Test
import org.mockito.Mockito.mock

class GenericFetchExternalActionTest {

    @Test
    fun `execute returns an error when no FETCH_EXTERNAL_GENERIC logic entry is configured`() {
        val globalParametersService = mock(GlobalParametersService::class.java)
        val genericObject = mock(GenericTableLayer::class.java)
        val declaration = testDeclaration(logic = listOf(ModuleActionLogic(type = "OTHER")))

        val result = GenericFetchExternalAction(globalParametersService).execute(
            "weather", emptyMap(), genericObject, declaration
        )

        assertEquals(mapOf("error" to "Missing FETCH_EXTERNAL_GENERIC configuration"), result)
    }

    @Test
    fun `execute returns an error when urlTemplate is missing from the logic config`() {
        val globalParametersService = mock(GlobalParametersService::class.java)
        val genericObject = mock(GenericTableLayer::class.java)
        val declaration = testDeclaration(
            logic = listOf(ModuleActionLogic(type = "FETCH_EXTERNAL_GENERIC", params = mapOf("responseMapping" to emptyMap<String, String>())))
        )

        val result = GenericFetchExternalAction(globalParametersService).execute(
            "weather", emptyMap(), genericObject, declaration
        )

        assertEquals(mapOf("error" to "'urlTemplate' not configured"), result)
    }
}
