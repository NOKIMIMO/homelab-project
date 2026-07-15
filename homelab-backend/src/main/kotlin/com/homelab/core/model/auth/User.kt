package com.homelab.core.model.auth

import jakarta.persistence.*
import java.time.LocalDateTime

@Entity
@Table(name = "users")
class User(
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    val id: Long? = null,

    @Column(nullable = false, unique = true)
    var email: String = "",

    @Column(nullable = true)
    var name: String? = null,

    @Column(nullable = true, length = 2048)
    var passwordHash: String? = null,

    @Column(nullable = false)
    var isAdmin: Boolean = false,
    
    @Column(nullable = true, length = 2048)
    var publicKey: String? = null,

    @ElementCollection(fetch = FetchType.EAGER)
    @CollectionTable(name = "user_permissions", joinColumns = [JoinColumn(name = "user_id")])
    @Column(name = "permission")
    var permissions: MutableSet<String> = mutableSetOf(),

    @ManyToMany(fetch = FetchType.EAGER)
    @JoinTable(
        name = "user_roles",
        joinColumns = [JoinColumn(name = "user_id")],
        inverseJoinColumns = [JoinColumn(name = "role_id")]
    )
    var roles: MutableSet<Role> = mutableSetOf(),

    // Set when an admin approves a password reset request: the current passwordHash is a
    // one-time temporary password that must be replaced via PUT /api/auth/password before
    // a second password login is accepted.
    // columnDefinition gives existing rows a default so Hibernate's ALTER TABLE ADD COLUMN
    // NOT NULL doesn't fail against a table that already has data.
    @Column(nullable = false, columnDefinition = "boolean default false")
    var mustResetPassword: Boolean = false,

    @Column(nullable = false)
    val createdAt: LocalDateTime = LocalDateTime.now()
)

