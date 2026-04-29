package com.snk.HomeStock.domain

import jakarta.persistence.Column
import jakarta.persistence.Embeddable
import java.io.Serializable
import java.util.UUID

@Embeddable
data class BoardAssetKey(
    @Column(name = "board_id")
    var boardId: UUID = UUID.randomUUID(),

    @Column(name = "asset_name")
    var assetName: String = ""
) : Serializable
