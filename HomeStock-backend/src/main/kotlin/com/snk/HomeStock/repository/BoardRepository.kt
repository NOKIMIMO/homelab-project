package com.snk.HomeStock.repository

import com.snk.HomeStock.domain.Board
import com.snk.HomeStock.domain.BoardAsset
import org.springframework.data.jpa.repository.JpaRepository
import java.util.UUID

interface BoardRepository : JpaRepository<Board, UUID> {
    fun findAllAssetOfBoardId(id: UUID): List<BoardAsset>
    fun deleteAllAssetOfBoardId(id: UUID)
    fun saveAllAssets(assets: List<BoardAsset>)
}
