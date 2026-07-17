package com.homelab.core.model.action

import com.homelab.sdk.data.GenericTableLayer
import com.homelab.sdk.module.action.ModuleActionParameter
import com.homelab.sdk.module.action.ModuleActionParameterType
import org.junit.jupiter.api.Assertions.assertEquals
import org.junit.jupiter.api.Test
import org.mockito.Mockito.mock
import org.mockito.Mockito.verify
import org.mockito.Mockito.`when`

class UpdateActionTest {

    @Test
    fun `execute updates using filters built from the declared filter params and the rest as data`() {
        val genericObject = mock(GenericTableLayer::class.java)
        val declaration = testDeclaration(
            parameters = listOf(ModuleActionParameter(name = "id", type = ModuleActionParameterType.EQUAL))
        )
        val expectedFilters = mapOf("id" to ("5" to ModuleActionParameterType.EQUAL))
        val expectedUpdateMap = mapOf("label" to "new")
        `when`(genericObject.updateByFilters(expectedFilters, expectedUpdateMap)).thenReturn(1)

        val result = UpdateAction().execute(
            "module-1",
            mapOf("id" to "5", "label" to "new"),
            genericObject,
            declaration
        )

        assertEquals(mapOf("updated" to 1), result)
        verify(genericObject).updateByFilters(expectedFilters, expectedUpdateMap)
    }

    @Test
    fun `execute keeps NONE-typed declared parameters in the update payload`() {
        val genericObject = mock(GenericTableLayer::class.java)
        val declaration = testDeclaration(
            parameters = listOf(
                ModuleActionParameter(name = "id", type = ModuleActionParameterType.EQUAL),
                ModuleActionParameter(name = "comment", type = ModuleActionParameterType.NONE)
            )
        )
        val expectedFilters = mapOf("id" to ("5" to ModuleActionParameterType.EQUAL))
        val expectedUpdateMap = mapOf("comment" to "hi")
        `when`(genericObject.updateByFilters(expectedFilters, expectedUpdateMap)).thenReturn(0)

        val result = UpdateAction().execute(
            "module-1",
            mapOf("id" to "5", "comment" to "hi"),
            genericObject,
            declaration
        )

        assertEquals(mapOf("updated" to 0), result)
    }
}
