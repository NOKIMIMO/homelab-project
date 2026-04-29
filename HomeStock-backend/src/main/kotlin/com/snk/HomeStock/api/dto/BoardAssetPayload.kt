package com.snk.HomeStock.api.dto

data class BoardAssetPayload(
    val asset_name: String? = null,
    val src: String,
    val scale: Float? = null,
    val rotation: Float? = null,
    val x_position: Float? = null,
    val y_position: Float? = null
)

