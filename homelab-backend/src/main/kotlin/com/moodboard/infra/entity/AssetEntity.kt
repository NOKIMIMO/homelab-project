package com.moodboard.entity

import jakarta.persistence.Column
import jakarta.persistence.Entity
import jakarta.persistence.GeneratedValue
import jakarta.persistence.GenerationType
import jakarta.persistence.Id
import jakarta.persistence.Table
import org.hibernate.annotations.CreationTimestamp
import java.time.OffsetDateTime

@Entity
@Table(name = "asset")
data class AssetEntity(
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    var id: Long = 0,

    @Column(nullable = false, unique = true)
    var name: String = "",

    @Column(columnDefinition = "jsonb")
    var metadata: String? = null,

    @Column(name = "date_photo")
    var datePhoto: OffsetDateTime? = null,

    @CreationTimestamp
    @Column(name = "date_upload", nullable = false, updatable = false)
    var dateUpload: OffsetDateTime? = null,

    @Column
    var origin: String? = null,
)