package com.snk.HomeStock.repository

import com.snk.HomeStock.domain.Board
import org.springframework.data.jpa.repository.JpaRepository
import java.util.UUID

interface BoardRepository : JpaRepository<Board, UUID>
