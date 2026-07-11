package com.homelab.core.model.module

import org.springframework.data.jpa.repository.JpaRepository
import org.springframework.stereotype.Repository

@Repository
interface ModuleSettingsRepository : JpaRepository<ModuleSettings, Long> {
    fun findByModuleId(moduleId: String): ModuleSettings?
}
