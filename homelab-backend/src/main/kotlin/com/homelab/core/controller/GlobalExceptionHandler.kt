package com.homelab.core.controller

import com.homelab.core.exception.ApiException
import com.homelab.core.exception.BadRequestException
import com.homelab.core.exception.NotFoundException
import com.homelab.core.exception.ForbiddenException
import com.homelab.core.exception.PersistenceException
import org.springframework.http.HttpStatus
import org.springframework.http.ResponseEntity
import org.springframework.web.bind.annotation.ControllerAdvice
import org.springframework.web.bind.annotation.ExceptionHandler

@ControllerAdvice
class GlobalExceptionHandler {

    @ExceptionHandler(ApiException::class)
    fun handleApiException(e: ApiException): ResponseEntity<Any> {
        val status = when (e) {
            is BadRequestException -> HttpStatus.BAD_REQUEST
            is NotFoundException -> HttpStatus.NOT_FOUND
            is ForbiddenException -> HttpStatus.FORBIDDEN
            is PersistenceException -> HttpStatus.INTERNAL_SERVER_ERROR
            else -> HttpStatus.INTERNAL_SERVER_ERROR
        }
        val body = mapOf(
            "success" to false,
            "error" to (e.message ?: "error"),
            "errorCode" to e.code
        )
        return ResponseEntity.status(status).body(body)
    }
}

