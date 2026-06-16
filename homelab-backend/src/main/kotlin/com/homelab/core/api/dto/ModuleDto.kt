package com.homelab.core.api.dto

import com.homelab.core.model.module.ModuleStatus

// icon is exposed as a URL (relative or absolute) rather than an HTTP response with resource.
data class ModuleDto(
    val id: String,
    val name: String,
    val version: String,
    val internalUrl: String,
    var status: ModuleStatus,
    // Relative URL to fetch the module icon (e.g. /api/modules/{id}/UI/icon)
    val icon: String?,
    val description: String? = null,
    var uptimeStart: Long? = null,
    val hasParams: Boolean = false,
){
    fun start() {
        status = ModuleStatus.ACTIVE
    }
    fun stop() {
        status = ModuleStatus.INACTIVE
    }
}