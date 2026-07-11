package com.homelab.core.model.device

import org.springframework.data.jpa.repository.JpaRepository
import org.springframework.stereotype.Repository
import java.util.Optional

@Repository
interface DeviceRegistrationRepository : JpaRepository<DeviceRegistration, Long> {
    fun findByEndpointUrl(endpointUrl: String): Optional<DeviceRegistration>

    fun findAllByUserId(userId: Long): List<DeviceRegistration>

    fun deleteByEndpointUrlAndUserId(endpointUrl: String, userId: Long): Long
}
