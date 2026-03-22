package com.homelab.core.controller

import com.homelab.core.service.ModuleService
import org.springframework.web.bind.annotation.CrossOrigin
import org.springframework.web.bind.annotation.GetMapping
import org.springframework.web.bind.annotation.RequestMapping
import org.springframework.web.bind.annotation.RestController

@RestController
@RequestMapping("/api")
@CrossOrigin(origins = ["*"])
class ModuleController(private val moduleService: ModuleService) {

    @GetMapping("/modules") fun getModules() = moduleService.getModules()
}
