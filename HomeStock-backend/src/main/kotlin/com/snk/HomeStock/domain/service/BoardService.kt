package com.snk.HomeStock.service

import com.snk.HomeStock.api.dto.BoardAssetPayload
import com.snk.HomeStock.api.dto.BoardPayload
import com.snk.HomeStock.api.dto.BoardDto
import com.snk.HomeStock.repository.BoardRepository
import com.snk.HomeStock.repository.AssetRepository
import com.snk.HomeStock.repository.model.Board
import com.snk.HomeStock.repository.model.BoardAsset
import com.snk.HomeStock.repository.model.BoardAssetKey
import com.snk.HomeStock.repository.model.Asset
import jakarta.transaction.Transactional
import org.springframework.stereotype.Service
import java.time.OffsetDateTime
import java.util.UUID

@Service
class BoardService(
    private val boardRepository: BoardRepository,
    private val assetRepository: AssetRepository,
    private val syncService: SyncService
) {

    fun listBoards(): List<BoardDto> {
        val boards = boardRepository.findAllWithAssets().sortedByDescending { it.lastUpdate }
        return boards.map { board ->
            val assets = board.assets.map { asset ->
                BoardAssetPayload(
                    assetName = asset.id.assetName,
                    src = asset.src,
                    scale = asset.scale,
                    rotation = asset.rotation,
                    xPosition = asset.xPosition,
                    yPosition = asset.yPosition
                )
            }
            board.toDto(assets)
        }
    }

    fun getBoard(id: UUID): BoardDto? {
        val board = boardRepository.findBoardWithAssetsById(id) ?: return null
        val assets = board.assets.map { asset ->
            BoardAssetPayload(
                assetName = asset.id.assetName,
                src = asset.src,
                scale = asset.scale,
                rotation = asset.rotation,
                xPosition = asset.xPosition,
                yPosition = asset.yPosition
            )
        }
        return board.toDto(assets)
    }

    @Transactional
    fun upsertBoard(id: UUID, payload: BoardPayload): UUID {
        val board = boardRepository.findById(id).orElse(null)?.apply {
            name = payload.name ?: name
            height = payload.height ?: height
            width = payload.width ?: width
            previewsrc = payload.previewsrc ?: previewsrc
        } ?: Board(
            id = id,
            name = payload.name ?: "Untitled Board",
            height = payload.height ?: 1080,
            width = payload.width ?: 1920,
            previewsrc = payload.previewsrc
        )

        if (payload.assets != null) {
            board.assets.clear()
            if (payload.assets.isNotEmpty()) {
                val entities = payload.assets.map { normalizeAsset(board, it) }
                board.assets.addAll(entities)
            }
        }

        boardRepository.save(board)

        syncService.recordSyncCheckpoint()
        return id
    }

    @Transactional
    fun deleteBoard(id: UUID): Boolean {
        val existing = boardRepository.findById(id).orElse(null) ?: return false
        boardRepository.delete(existing)
        syncService.recordSyncCheckpoint()
        return true
    }

    private fun normalizeAsset(board: Board, payload: BoardAssetPayload): BoardAsset {
        val assetName = payload.src.substringAfterLast('/')
        val associatedAsset: Asset = assetRepository.findByName(assetName) ?: Asset(
            name = assetName,
            metadata = null,
            datePhoto = null,
            dateUpload = OffsetDateTime.now(),
            origin = "auto-created"
        )

        val clampedX = clampToBoard(payload.xPosition, board.width)
        val clampedY = clampToBoard(payload.yPosition, board.height)

        return BoardAsset(
            id = BoardAssetKey(boardId = board.id, assetName = assetName),
            board = board,
            asset = associatedAsset,
            src = payload.src,
            scale = payload.scale ?: 1.0f,
            rotation = payload.rotation ?: 0.0f,
            xPosition = clampedX,
            yPosition = clampedY
        )
    }

    // Spec : Quand un "Board Asset" est placé en dehors du "Board"
    // alors son emplacement est placé au limite du Board
    private fun clampToBoard(value: Float?, max: Int): Float {
        return (value ?: 0.0f).coerceIn(0.0f, max.toFloat())
    }

    private fun Board.toDto(assets: List<BoardAssetPayload>) = BoardDto(
        id = id.toString(),
        name = name,
        height = height,
        width = width,
        previewsrc = previewsrc,
        last_update = lastUpdate?.toString(),
        created_at = createdAt?.toString(),
        assets = assets
    )
}
