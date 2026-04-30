package com.snk.HomeStock.domain.entity

data class BoardAssetClass(
    val assetName: String,
    val src: String,
    val scale: Float,
    val rotation: Float,
    val xPosition: Float,
    val yPosition: Float
)