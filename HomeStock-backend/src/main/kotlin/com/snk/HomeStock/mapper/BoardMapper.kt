package com.snk.HomeStock.mapper

import com.snk.HomeStock.domain.entity.BoardClass
import com.snk.HomeStock.repository.model.Board

class BoardMapper() {
    fun fromEntity(board: Board) = BoardClass(
        id = board.id.toString(),
        name = board.name,
        height = board.height,
        width = board.width,
        previewsrc = board.previewsrc,
        last_update = board.lastUpdate?.toString(),
        created_at = board.createdAt?.toString(),
        assets = emptyList()
    )
}