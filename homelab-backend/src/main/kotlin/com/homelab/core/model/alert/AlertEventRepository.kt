package com.homelab.core.model.alert

import org.springframework.data.domain.Pageable
import org.springframework.data.jpa.repository.JpaRepository
import org.springframework.stereotype.Repository
import java.util.Optional

@Repository
interface AlertEventRepository : JpaRepository<AlertEvent, Long> {
    fun findFirstByRuleIdAndResolvedFalse(ruleId: Long): Optional<AlertEvent>

    fun findAllByOrderByTriggeredAtDesc(pageable: Pageable): List<AlertEvent>

    fun findAllByRuleIdAndResolvedFalse(ruleId: Long): List<AlertEvent>
}
