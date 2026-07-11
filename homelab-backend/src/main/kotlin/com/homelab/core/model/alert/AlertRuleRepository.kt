package com.homelab.core.model.alert

import org.springframework.data.jpa.repository.JpaRepository
import org.springframework.stereotype.Repository

@Repository
interface AlertRuleRepository : JpaRepository<AlertRule, Long> {
    fun findByEnabledTrue(): List<AlertRule>
}
