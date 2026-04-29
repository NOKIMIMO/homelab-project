package com.snk.HomeStock.service


import com.snk.HomeStock.api.dto.BoardAssetPayload
import com.snk.HomeStock.api.dto.BoardPayload
import com.snk.HomeStock.api.dto.BoardDto
import com.snk.HomeStock.repository.BoardRepository
import com.snk.HomeStock.repository.BoardAssetRepository
import jakarta.transaction.Transactional
import org.springframework.data.domain.Sort
import org.springframework.stereotype.Service
import java.util.UUID

@Service
class BoardService(
    private val boardRepository: BoardRepository,
    private val syncService: SyncService
) {

    fun listBoards(): List<BoardDto> {
        val boards = boardRepository.findAll(Sort.by(Sort.Direction.DESC, "lastUpdate"))
        return boards.map { board ->
            val assets = boardRepository.findAllAssetOfBoardId(board.id).map { asset ->
                BoardAssetPayload(
                    asset_name = asset.id.assetName,
                    src = asset.src,
                    scale = asset.scale,
                    rotation = asset.rotation,
                    x_position = asset.xPosition,
                    y_position = asset.yPosition
                )
            }
            board.toDto(assets)
        }
    }

    fun getBoard(id: UUID): BoardDto? {
        val board = boardRepository.findById(id).orElse(null) ?: return null
        val assets = boardRepository.findAllAssetOfBoardId(id).map { asset ->
            BoardAssetPayload(
                asset_name = asset.id.assetName,
                src = asset.src,
                scale = asset.scale,
                rotation = asset.rotation,
                x_position = asset.xPosition,
                y_position = asset.yPosition
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

        boardRepository.save(board)

        if (payload.assets != null) {
            boardRepository.deleteAllAssetOfBoardId(id)
            if (payload.assets.isNotEmpty()) {
                val entities = payload.assets.map { normalizeAsset(board, it) }
                boardRepository.saveAllAssets(entities)
            }
        }

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
        return BoardAsset(
            id = BoardAssetKey(boardId = board.id, assetName = assetName),
            board = board,
            src = payload.src,
            scale = payload.scale ?: 1.0f,
            rotation = payload.rotation ?: 0.0f,
            xPosition = payload.x_position ?: 0.0f,
            yPosition = payload.y_position ?: 0.0f
        )
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
