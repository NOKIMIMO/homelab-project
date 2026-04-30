package com.snk.HomeStock.api.dto

data class BoardAssetPayload(
    val assetName: String? = null,
    val src: String,
    val scale: Float? = null,
    val rotation: Float? = null,
    val xPosition: Float? = null,
    val yPosition: Float? = null
)

