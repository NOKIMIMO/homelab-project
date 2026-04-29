package com.snk.HomeStock.api.dto


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
