package com.homelab.core.model.auth

import org.springframework.data.jpa.repository.JpaRepository
import org.springframework.stereotype.Repository
import java.util.*

@Repository
interface UserRepository : JpaRepository<User, Long> {
    fun findByPublicKey(publicKey: String): Optional<User>
    fun findByEmail(email: String): Optional<User>
}
