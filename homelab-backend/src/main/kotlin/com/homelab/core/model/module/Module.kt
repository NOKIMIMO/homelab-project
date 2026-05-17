package com.homelab.core.model.module

data class Module(
        val id: String,
        val name: String,
        val version: String,
        val internalUrl: String,
        var status: ModuleStatus,
        val icon: String,
        val description: String? = null,
        var uptimeStart: Long? = null,
){
        fun start() {
                status = ModuleStatus.ACTIVE
        }
        fun stop() {
                status = ModuleStatus.INACTIVE
        }
}
