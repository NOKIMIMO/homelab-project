package com.homelab.core.service

import com.homelab.core.model.Module
import org.springframework.stereotype.Service

@Service
class ModuleService {
    private val modules = listOf(
        Module(
            id = "photo",
            name = "Stockage Photo",
            port = 8081,
            internalUrl = "http://localhost:8081",
            status = "ACTIVE",
            icon = "Image"
        )
    )

    fun getModules(): List<Module> = modules

    fun getModule(id: String): Module? = modules.find { it.id == id }
}
