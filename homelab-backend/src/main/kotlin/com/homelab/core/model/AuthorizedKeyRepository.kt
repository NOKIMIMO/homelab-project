package com.homelab.core.model

import org.springframework.data.jpa.repository.JpaRepository
import org.springframework.stereotype.Repository
import java.util.*

@Repository
interface AuthorizedKeyRepository : JpaRepository<AuthorizedKey, Long> {
    fun findByPublicKey(publicKey: String): Optional<AuthorizedKey>
}
