package com.homelab.core.model.alert

import java.time.LocalDateTime
import org.springframework.data.jpa.repository.JpaRepository
import org.springframework.stereotype.Repository

@Repository
interface AlertEventRepository : JpaRepository<AlertEvent, Long> {
    /** Events strictly after [since], newest first — used by the mobile app's incremental polling. */
    fun findByTriggeredAtAfterOrderByTriggeredAtDesc(since: LocalDateTime): List<AlertEvent>

    /** Fallback when no `since` is provided: the latest 100 events. */
    fun findTop100ByOrderByTriggeredAtDesc(): List<AlertEvent>
}
