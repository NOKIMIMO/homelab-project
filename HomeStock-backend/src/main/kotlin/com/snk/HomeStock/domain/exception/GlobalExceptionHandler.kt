package com.snk.HomeStock.domain.exception

import org.springframework.http.HttpStatus
import org.springframework.http.ResponseEntity
import org.springframework.web.bind.annotation.ControllerAdvice
import org.springframework.web.bind.annotation.ExceptionHandler
import org.springframework.web.ErrorResponse

import java.util.NoSuchElementException
import com.snk.HomeStock.api.dto.ErrorResponseDto

@ControllerAdvice
class GlobalExceptionHandler {

    @ExceptionHandler(NoSuchElementException::class)
    fun handleNotFoundException(
        ex: NoSuchElementException
    ): ResponseEntity<ErrorResponseDto> {
        val errorResponse = ErrorResponseDto(
            status = HttpStatus.NOT_FOUND.value(),
            error = "Not Found"
        )
        return ResponseEntity.status(HttpStatus.NOT_FOUND).body(errorResponse)
    }

    @ExceptionHandler(IllegalArgumentException::class)
    fun handleBadRequestException(
        ex: IllegalArgumentException
    ): ResponseEntity<ErrorResponseDto> {
        val errorResponse = ErrorResponseDto(
            status = HttpStatus.BAD_REQUEST.value(),
            error = "Bad Request",
            message = ex.message
        )
        return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(errorResponse)
    }

    @ExceptionHandler(Exception::class)
    fun handleGenericException(): ResponseEntity<ErrorResponseDto> {
        val errorResponse = ErrorResponseDto(
            status = HttpStatus.INTERNAL_SERVER_ERROR.value(),
            error = "Internal Server Error"
        )
        return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(errorResponse)
    }
}