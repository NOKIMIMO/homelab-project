package com.moodboard.entity

import jakarta.persistence.*

@Entity
@Table(name = "users")
data class UserEntity(
    @Id 
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    var id: Long = 0,
    
    @Column(unique = true, nullable = false)
    var username: String = "",
    
    @Column(unique = true, nullable = false)
    var email: String = "",
    
    @Column(nullable = false)
    var password: String = ""
)