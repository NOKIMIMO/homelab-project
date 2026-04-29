package com.moodboard.entity

import java.io.Serializable
import java.util.UUID

data class BoardAssetId(
    var boardId: UUID? = null,
    var assetName: String = "",
) : Serializable