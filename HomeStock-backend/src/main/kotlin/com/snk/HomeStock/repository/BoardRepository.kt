package com.snk.HomeStock.repository

import com.snk.HomeStock.repository.model.Board
import com.snk.HomeStock.repository.model.BoardAsset
import org.springframework.data.jpa.repository.JpaRepository
import org.springframework.data.jpa.repository.Query
import org.springframework.data.repository.query.Param
import java.util.UUID

interface BoardRepository : JpaRepository<Board, UUID> {
    @Query("SELECT b FROM Board b LEFT JOIN FETCH b.assets")
    fun findAllWithAssets(): List<Board>

    @Query("SELECT b FROM Board b LEFT JOIN FETCH b.assets WHERE b.id = :id")
    fun findBoardWithAssetsById(@Param("id") id: UUID): Board?
}
