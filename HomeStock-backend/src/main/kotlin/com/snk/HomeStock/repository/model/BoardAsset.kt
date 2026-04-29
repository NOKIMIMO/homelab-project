package com.snk.HomeStock.repository.model

import jakarta.persistence.Column
import jakarta.persistence.EmbeddedId
import jakarta.persistence.Entity
import jakarta.persistence.JoinColumn
import jakarta.persistence.ManyToOne
import jakarta.persistence.MapsId
import jakarta.persistence.Table
import org.hibernate.annotations.UpdateTimestamp
import java.time.OffsetDateTime

@Entity
@Table(name = "board_asset")
class BoardAsset(
    @EmbeddedId
    var id: BoardAssetKey,

    @ManyToOne(optional = false)
    @MapsId("boardId")
    @JoinColumn(name = "board_id")
    var board: Board,

    @Column(nullable = false)
    var scale: Float = 1.0f,

    @Column(nullable = false)
    var rotation: Float = 0.0f,

    @Column(name = "x_position", nullable = false)
    var xPosition: Float = 0.0f,

    @Column(name = "y_position", nullable = false)
    var yPosition: Float = 0.0f,

    @Column(nullable = false)
    var src: String,

    @UpdateTimestamp
    @Column(name = "last_update", nullable = false)
    var lastUpdate: OffsetDateTime? = null
)
