package com.moodboard.entity

import jakarta.persistence.Column
import jakarta.persistence.Entity
import jakarta.persistence.FetchType
import jakarta.persistence.Id
import jakarta.persistence.IdClass
import jakarta.persistence.JoinColumn
import jakarta.persistence.ManyToOne
import jakarta.persistence.Table
import org.hibernate.annotations.UpdateTimestamp
import java.time.OffsetDateTime
import java.util.UUID

@Entity
@Table(name = "board_asset")
@IdClass(BoardAssetId::class)
data class BoardAssetEntity(
    @Id
    @Column(name = "board_id", nullable = false)
    var boardId: UUID? = null,

    @Id
    @Column(name = "asset_name", nullable = false)
    var assetName: String = "",

    @Column(nullable = false)
    var scale: Double = 1.0,

    @Column(nullable = false)
    var rotation: Double = 0.0,

    @Column(name = "x_position", nullable = false)
    var xPosition: Double = 0.0,

    @Column(name = "y_position", nullable = false)
    var yPosition: Double = 0.0,

    @Column(nullable = false)
    var src: String = "",

    @UpdateTimestamp
    @Column(name = "last_update", nullable = false)
    var lastUpdate: OffsetDateTime? = null,

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "board_id", referencedColumnName = "id", insertable = false, updatable = false)
    var board: BoardEntity? = null,
)