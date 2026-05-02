package com.homelab.core.model.auth

import org.springframework.data.jpa.repository.JpaRepository
import org.springframework.stereotype.Repository
import java.util.*

@Repository
interface SignupRequestRepository : JpaRepository<SignupRequest, Long> {
    fun findByEmail(email: String): Optional<SignupRequest>
}

