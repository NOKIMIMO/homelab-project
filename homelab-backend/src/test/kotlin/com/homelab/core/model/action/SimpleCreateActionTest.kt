package com.homelab.core.model.action

import com.homelab.core.exception.BadRequestException
import com.homelab.sdk.data.GenericTableLayer
import org.junit.jupiter.api.Assertions.assertEquals
import org.junit.jupiter.api.Test
import org.mockito.Mockito.mock
import org.mockito.Mockito.`when`

class SimpleCreateActionTest {

    @Test
    fun `execute returns created true when the layer accepts the record`() {
        val genericObject = mock(GenericTableLayer::class.java)
        val params = mapOf("label" to "hello")
        `when`(genericObject.create(params)).thenReturn(true)

        val result = SimpleCreateAction().execute("module-1", params, genericObject, testDeclaration())

        assertEquals(mapOf("created" to true), result)
    }

    @Test
    fun `execute returns created false when the layer rejects the record`() {
        val genericObject = mock(GenericTableLayer::class.java)
        val params = mapOf("label" to "hello")
        `when`(genericObject.create(params)).thenReturn(false)

        val result = SimpleCreateAction().execute("module-1", params, genericObject, testDeclaration())

        assertEquals(mapOf("created" to false), result)
    }

    @Test
    fun `execute surfaces an ApiException's code and message when creation throws`() {
        val genericObject = mock(GenericTableLayer::class.java)
        val params = mapOf("label" to "hello")
        `when`(genericObject.create(params)).thenThrow(BadRequestException("duplicate key"))

        val result = SimpleCreateAction().execute("module-1", params, genericObject, testDeclaration())

        assertEquals(mapOf("created" to false, "error" to "duplicate key", "errorCode" to "BAD_REQUEST"), result)
    }

    @Test
    fun `execute surfaces a generic exception message without an error code`() {
        val genericObject = mock(GenericTableLayer::class.java)
        val params = mapOf("label" to "hello")
        `when`(genericObject.create(params)).thenThrow(RuntimeException("boom"))

        val result = SimpleCreateAction().execute("module-1", params, genericObject, testDeclaration())

        assertEquals(mapOf("created" to false, "error" to "boom"), result)
    }
}
