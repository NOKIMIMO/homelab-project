package com.homelab.core.controller

import com.homelab.core.exception.BadRequestException
import com.homelab.core.exception.ForbiddenException
import com.homelab.core.exception.NotFoundException
import com.homelab.core.exception.PersistenceException
import org.junit.jupiter.api.Assertions.assertEquals
import org.junit.jupiter.api.Test
import org.springframework.http.HttpStatus

class GlobalExceptionHandlerTest {

    private val handler = GlobalExceptionHandler()

    @Test
    fun `handleApiException maps BadRequestException to 400`() {
        val response = handler.handleApiException(BadRequestException("bad input"))

        assertEquals(HttpStatus.BAD_REQUEST, response.statusCode)
        assertEquals(mapOf("success" to false, "error" to "bad input", "errorCode" to "BAD_REQUEST"), response.body)
    }

    @Test
    fun `handleApiException maps NotFoundException to 404`() {
        val response = handler.handleApiException(NotFoundException("missing"))

        assertEquals(HttpStatus.NOT_FOUND, response.statusCode)
        assertEquals("NOT_FOUND", (response.body as Map<*, *>)["errorCode"])
    }

    @Test
    fun `handleApiException maps ForbiddenException to 403`() {
        val response = handler.handleApiException(ForbiddenException("nope"))

        assertEquals(HttpStatus.FORBIDDEN, response.statusCode)
    }

    @Test
    fun `handleApiException maps PersistenceException to 500`() {
        val response = handler.handleApiException(PersistenceException("db error"))

        assertEquals(HttpStatus.INTERNAL_SERVER_ERROR, response.statusCode)
    }

    @Test
    fun `handleApiException defaults message to error when null`() {
        val response = handler.handleApiException(BadRequestException(null))

        assertEquals("error", (response.body as Map<*, *>)["error"])
    }
}
