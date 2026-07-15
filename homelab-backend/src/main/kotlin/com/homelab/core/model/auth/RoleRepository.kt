package com.homelab.core.model.auth

import org.springframework.data.jpa.repository.JpaRepository
import org.springframework.stereotype.Repository

@Repository
interface RoleRepository : JpaRepository<Role, Long> {
    fun findByNameIgnoreCase(name: String): Role?
    fun existsByNameIgnoreCase(name: String): Boolean
}
