package com.snk.HomeStock.repository

import org.springframework.data.jpa.repository.JpaRepository
import org.springframework.stereotype.Repository
import com.snk.HomeStock.repository.model.UserEntity

@Repository
interface UserRepository : JpaRepository<UserEntity, Long>