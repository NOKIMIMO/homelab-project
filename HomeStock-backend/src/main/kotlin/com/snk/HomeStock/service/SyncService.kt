package com.snk.HomeStock.service

import com.snk.HomeStock.domain.Synchro
import com.snk.HomeStock.repository.SynchroRepository
import org.springframework.stereotype.Service
import java.time.OffsetDateTime

@Service
class SyncService(private val synchroRepository: SynchroRepository) {

    fun recordSyncCheckpoint() {
        synchroRepository.save(Synchro())
    }

    fun latestSyncDate(): OffsetDateTime? = synchroRepository.findTopByOrderByDateDesc()?.date
}
