package com.snk.HomeStock.dto

data class PhotoMetadataDto(
    val stats: Map<String, Any?>,
    val exif: Map<String, Any?>? = null,
    val error: String? = null
)

data class PhotoDto(
    val name: String,
    val url: String,
    val date: Long,
    val uploadDate: Long,
    val metadata: PhotoMetadataDto
)

data class BoardAssetPayload(
    val asset_name: String? = null,
    val src: String,
    val scale: Float? = null,
    val rotation: Float? = null,
    val x_position: Float? = null,
    val y_position: Float? = null
)

data class BoardPayload(
    val name: String? = null,
    val height: Int? = null,
    val width: Int? = null,
    val previewsrc: String? = null,
    val assets: List<BoardAssetPayload>? = null
)

data class BoardDto(
    val id: String,
    val name: String,
    val height: Int,
    val width: Int,
    val previewsrc: String?,
    val last_update: String?,
    val created_at: String?,
    val assets: List<BoardAssetPayload>
)
