package com.snk.HomeStock.repository.model
import jakarta.persistence.Column
import jakarta.persistence.Entity
import jakarta.persistence.Id
import jakarta.persistence.Table
import org.hibernate.annotations.CreationTimestamp
import org.hibernate.annotations.UpdateTimestamp
import java.time.OffsetDateTime
import java.util.UUID

@Entity
@Table(name = "board")
class Board(
    @Id
    var id: UUID,

    @Column(nullable = false)
    var name: String,

    @Column(nullable = false)
    var height: Int,

    @Column(nullable = false)
    var width: Int,

    @Column
    var previewsrc: String? = null,

    @UpdateTimestamp
    @Column(name = "last_update", nullable = false)
    var lastUpdate: OffsetDateTime? = null,

    @CreationTimestamp
    @Column(name = "created_at", nullable = false, updatable = false)
    var createdAt: OffsetDateTime? = null
)
