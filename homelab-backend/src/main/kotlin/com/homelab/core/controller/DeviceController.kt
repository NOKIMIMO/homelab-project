package com.homelab.core.controller

import com.homelab.core.api.dto.DeviceRegisterRequest
import com.homelab.core.api.dto.DeviceUnregisterRequest
import com.homelab.core.exception.NotFoundException
import com.homelab.core.model.auth.UserRepository
import com.homelab.core.model.device.DeviceRegistration
import com.homelab.core.service.DeviceRegistrationService
import org.springframework.security.core.Authentication
import org.springframework.web.bind.annotation.*

@RestController
@RequestMapping("/api/devices")
@CrossOrigin(origins = ["*"])
class DeviceController(
    private val deviceRegistrationService: DeviceRegistrationService,
    private val userRepository: UserRepository
) {

    @PostMapping
    fun register(@RequestBody body: DeviceRegisterRequest, authentication: Authentication): DeviceRegistration =
        deviceRegistrationService.register(currentUserId(authentication), body.endpointUrl)

    @DeleteMapping
    fun unregister(@RequestBody body: DeviceUnregisterRequest, authentication: Authentication) {
        deviceRegistrationService.unregister(currentUserId(authentication), body.endpointUrl)
    }

    private fun currentUserId(authentication: Authentication): Long {
        val user = userRepository.findByEmail(authentication.name)
            .orElseThrow { NotFoundException("Authenticated user not found") }
        return user.id ?: throw NotFoundException("Authenticated user not found")
    }
}
