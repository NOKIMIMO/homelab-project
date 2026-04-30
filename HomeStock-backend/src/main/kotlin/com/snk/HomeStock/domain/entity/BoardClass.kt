package com.snk.HomeStock.domain.entity

import com.snk.HomeStock.api.dto.BoardAssetPayload
import com.snk.HomeStock.api.dto.BoardDto
import com.snk.HomeStock.repository.model.Board
import java.time.OffsetDateTime
import java.util.UUID

data class BoardClass(

    val id: UUID,
    val name: String,
    val height: Int,
    val width: Int,
    val previewsrc: String?,
    val lastUpdate: OffsetDateTime?,
    val createdAt: OffsetDateTime?,
    val assets: List<BoardAssetClass>
) {

}
