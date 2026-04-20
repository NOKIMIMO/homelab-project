package com.snk.HomeStock.repository

import com.snk.HomeStock.domain.BoardAsset
import com.snk.HomeStock.domain.BoardAssetKey
import org.springframework.data.jpa.repository.JpaRepository
import java.util.UUID

interface BoardAssetRepository : JpaRepository<BoardAsset, BoardAssetKey> {
    fun findAllByIdBoardId(boardId: UUID): List<BoardAsset>
    fun deleteAllByIdBoardId(boardId: UUID)
}
