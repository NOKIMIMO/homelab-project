package com.snk.HomeStock.api.dto

data class PhotoMetadataDto(
    val stats: Map<String, Any?>,
    val exif: Map<String, Any?>? = null,
    val error: String? = null
)
