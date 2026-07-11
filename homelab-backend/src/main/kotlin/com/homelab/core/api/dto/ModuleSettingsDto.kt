package com.homelab.core.api.dto

import com.homelab.core.model.module.ModuleSettings

data class ModuleSettingsDto(
    val writeAdminOnly: Boolean,
    val deleteAdminOnly: Boolean,
)

fun ModuleSettings.toDto() = ModuleSettingsDto(
    writeAdminOnly = writeAdminOnly,
    deleteAdminOnly = deleteAdminOnly,
)
