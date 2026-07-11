package com.homelab.core.model.auth

import org.springframework.data.jpa.repository.JpaRepository
import org.springframework.stereotype.Repository

@Repository
interface PasswordResetRequestRepository : JpaRepository<PasswordResetRequest, Long> {
    fun existsByEmailAndStatus(email: String, status: String): Boolean
}
