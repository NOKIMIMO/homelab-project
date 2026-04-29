package com.snk.HomeStock.api.dto


data class PhotoDto(
    val name: String,
    val url: String,
    val date: Long,
    val uploadDate: Long,
    val metadata: PhotoMetadataDto
)
