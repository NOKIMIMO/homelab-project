package com.homelab.core.controller

import com.homelab.core.service.TelemetryService
import org.springframework.web.bind.annotation.CrossOrigin
import org.springframework.web.bind.annotation.GetMapping
import org.springframework.web.bind.annotation.RequestMapping
import org.springframework.web.bind.annotation.RestController

@RestController
@RequestMapping("/api/telemetry")
@CrossOrigin(origins = ["*"])
class TelemetryController(private val telemetryService: TelemetryService) {

    @GetMapping fun getTelemetry() = telemetryService.getTelemetry()
}
