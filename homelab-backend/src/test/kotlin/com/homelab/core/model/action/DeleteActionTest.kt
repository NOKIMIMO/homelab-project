package com.homelab.core.model.action

import com.homelab.sdk.data.GenericTableLayer
import com.homelab.sdk.module.action.ModuleActionParameterType
import org.junit.jupiter.api.Assertions.assertEquals
import org.junit.jupiter.api.Test
import org.mockito.Mockito.mock
import org.mockito.Mockito.verify
import org.mockito.Mockito.`when`

class DeleteActionTest {

    @Test
    fun `execute builds filters from the id parameter and returns the deleted count`() {
        val genericObject = mock(GenericTableLayer::class.java)
        val expectedFilters = mapOf("id" to ("42" to ModuleActionParameterType.EQUAL))
        `when`(genericObject.delete(expectedFilters)).thenReturn(3)

        val result = DeleteAction().execute(
            "module-1",
            mapOf("id" to "42"),
            genericObject,
            testDeclaration()
        )

        assertEquals(mapOf("deleted" to 3), result)
        verify(genericObject).delete(expectedFilters)
    }

    @Test
    fun `execute falls back to id from merged params when no parameters are declared`() {
        val genericObject = mock(GenericTableLayer::class.java)
        val expectedFilters = mapOf("id" to ("abc" to ModuleActionParameterType.EQUAL))
        `when`(genericObject.delete(expectedFilters)).thenReturn(1)

        val result = DeleteAction().execute(
            "module-1",
            mapOf("id" to "abc"),
            genericObject,
            testDeclaration(parameters = emptyList())
        )

        assertEquals(mapOf("deleted" to 1), result)
    }
}
