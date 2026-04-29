package com.snk.HomeStock.api.dto

import com.fasterxml.jackson.annotation.JsonInclude

@JsonInclude(JsonInclude.Include.NON_NULL)
data class ErrorResponseDto(
    val status: Int,
    val error: String,
    val message: String? = null
)