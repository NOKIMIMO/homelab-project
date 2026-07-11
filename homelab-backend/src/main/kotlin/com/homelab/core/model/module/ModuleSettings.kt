package com.homelab.core.model.module

import jakarta.persistence.*
import java.time.LocalDateTime

@Entity
@Table(name = "module_settings")
class ModuleSettings(
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    val id: Long? = null,

    @Column(name = "module_id", nullable = false, unique = true)
    var moduleId: String = "",

    @Column(name = "write_admin_only", nullable = false)
    var writeAdminOnly: Boolean = false,

    @Column(name = "delete_admin_only", nullable = false)
    var deleteAdminOnly: Boolean = false,

    @Column(name = "updated_at", nullable = false)
    var updatedAt: LocalDateTime = LocalDateTime.now()
)
