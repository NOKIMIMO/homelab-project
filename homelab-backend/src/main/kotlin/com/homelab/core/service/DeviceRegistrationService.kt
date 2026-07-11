package com.homelab.core.service

import com.homelab.core.exception.BadRequestException
import com.homelab.core.exception.NotFoundException
import com.homelab.core.model.device.DeviceRegistration
import com.homelab.core.model.device.DeviceRegistrationRepository
import java.time.LocalDateTime
import org.springframework.stereotype.Service
import org.springframework.transaction.annotation.Transactional

@Service
class DeviceRegistrationService(
    private val deviceRepository: DeviceRegistrationRepository
) {
    fun register(userId: Long, endpointUrl: String): DeviceRegistration {
        if (endpointUrl.isBlank()) throw BadRequestException("endpointUrl is required")
        val existing = deviceRepository.findByEndpointUrl(endpointUrl)
        return if (existing.isPresent) {
            val d = existing.get()
            d.userId = userId
            d.lastUsedAt = LocalDateTime.now()
            deviceRepository.save(d)
        } else {
            deviceRepository.save(DeviceRegistration(userId = userId, endpointUrl = endpointUrl))
        }
    }

    @Transactional
    fun unregister(userId: Long, endpointUrl: String) {
        val deleted = deviceRepository.deleteByEndpointUrlAndUserId(endpointUrl, userId)
        if (deleted == 0L) throw NotFoundException("Device registration not found")
    }

    fun getAllEndpoints(): List<String> = deviceRepository.findAll().map { it.endpointUrl }
}
