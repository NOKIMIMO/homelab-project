package com.snk.HomeStock.mapper

import com.snk.HomeStock.api.dto.BoardAssetPayload
import com.snk.HomeStock.api.dto.BoardDto
import com.snk.HomeStock.domain.entity.BoardAssetClass
import com.snk.HomeStock.domain.entity.BoardClass
import com.snk.HomeStock.repository.model.Board
import com.snk.HomeStock.repository.model.BoardAsset
import org.springframework.stereotype.Component

@Component
class BoardMapper() {
    fun fromEntity(board: Board) = BoardClass(
        id = board.id,
        name = board.name,
        height = board.height,
        width = board.width,
        previewsrc = board.previewsrc,
        lastUpdate = board.lastUpdate,
        createdAt = board.createdAt,
        assets = emptyList(), // SQL link
    )

    fun fromEntities(boards: List<Board>) = boards.map { fromEntity(it) }

    fun toDto(board: BoardClass) = BoardDto(
        id = board.id.toString(),
        name = board.name,
        height = board.height,
        width = board.width,
        previewsrc = board.previewsrc,
        last_update = board.lastUpdate?.toString(),
        created_at = board.createdAt?.toString(),
        assets = boardAssetsToDto(board.assets)
    )
    fun entityToDto(board: Board) = BoardDto(
        id = board.id.toString(),
        name = board.name,
        height = board.height,
        width = board.width,
        previewsrc = board.previewsrc,
        last_update = board.lastUpdate?.toString(),
        created_at = board.createdAt?.toString(),
        assets = board.assets.map { boardAssetEntityToDto(it) }
    )

    fun boardAssetToDto(boardAssets: BoardAssetClass) = BoardAssetPayload(
        assetName = boardAssets.assetName,
        src = boardAssets.src,
        scale = boardAssets.scale,
        rotation = boardAssets.rotation,
        xPosition = boardAssets.xPosition,
        yPosition = boardAssets.yPosition,
    )
    fun boardAssetsToDto(boardAssets: List<BoardAssetClass>): List<BoardAssetPayload>
        = boardAssets.map { boardAssetToDto(it) }

    fun boardAssetEntityToDto(boardAsset: BoardAsset) = BoardAssetPayload(
        assetName = boardAsset.id.assetName,
        src = boardAsset.src,
        scale = boardAsset.scale,
        rotation = boardAsset.rotation,
        xPosition = boardAsset.xPosition,
        yPosition = boardAsset.yPosition
    )
}