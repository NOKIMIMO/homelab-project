package com.moodboard.repository

import org.springframework.data.jpa.repository.JpaRepository
import org.springframework.stereotype.Repository
import com.moodboard.entity.UserEntity

@Repository
interface UserRepository : JpaRepository<UserEntity, Long>
