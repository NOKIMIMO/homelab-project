package com.homelab.core.model.action

import com.homelab.sdk.data.GenericTableLayer
import com.homelab.sdk.module.action.ModuleActionParameterType
import org.junit.jupiter.api.Assertions.assertEquals
import org.junit.jupiter.api.Assertions.assertSame
import org.junit.jupiter.api.Test
import org.mockito.Mockito.mock
import org.mockito.Mockito.`when`

class ListActionTest {

    @Test
    fun `execute returns the rows found for the built filters unmodified`() {
        val genericObject = mock(GenericTableLayer::class.java)
        val expectedFilters = mapOf("id" to ("7" to ModuleActionParameterType.EQUAL))
        val rows = listOf(mapOf("id" to "7", "label" to "a"), mapOf("id" to "7", "label" to "b"))
        `when`(genericObject.find(expectedFilters)).thenReturn(rows)

        val result = ListAction().execute("module-1", mapOf("id" to "7"), genericObject, testDeclaration())

        assertSame(rows, result)
    }

    @Test
    fun `execute uses an empty filter map when no declared parameters and no id present`() {
        val genericObject = mock(GenericTableLayer::class.java)
        `when`(genericObject.find(emptyMap())).thenReturn(emptyList())

        val result = ListAction().execute(
            "module-1",
            mapOf("other" to "value"),
            genericObject,
            testDeclaration(parameters = emptyList())
        )

        assertEquals(emptyList<Any>(), result)
    }
}
