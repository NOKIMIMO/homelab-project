package com.homelab.core.service

import com.homelab.core.model.auth.LoginSettings
import com.homelab.core.model.auth.LoginSettingsRepository
import org.springframework.stereotype.Service
import java.time.LocalDateTime

// The owner-configurable description shown on the login card (a la Minecraft server MOTD).
// Single active row, publicly readable since the login page itself isn't authenticated.
@Service
class LoginSettingsService(private val repository: LoginSettingsRepository) {

    fun getDescription(): String? = repository.findAll().firstOrNull()?.description

    fun setDescription(description: String?): String? {
        val current = repository.findAll().firstOrNull() ?: LoginSettings()
        current.description = description
        current.updatedAt = LocalDateTime.now()
        repository.save(current)
        return current.description
    }
}
