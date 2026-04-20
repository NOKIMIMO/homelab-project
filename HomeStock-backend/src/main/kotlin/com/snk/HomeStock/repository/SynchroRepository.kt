package com.snk.HomeStock.repository

import com.snk.HomeStock.domain.Synchro
import org.springframework.data.jpa.repository.JpaRepository
import java.util.UUID

interface SynchroRepository : JpaRepository<Synchro, UUID> {
    fun findTopByOrderByDateDesc(): Synchro?
}
