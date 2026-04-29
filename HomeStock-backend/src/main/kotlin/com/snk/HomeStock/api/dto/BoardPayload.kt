package com.snk.HomeStock.api.dto

data class BoardPayload(
    val name: String? = null,
    val height: Int? = null,
    val width: Int? = null,
    val previewsrc: String? = null,
    val assets: List<BoardAssetPayload>? = null
)

