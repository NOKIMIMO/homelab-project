package com.snk.HomeStock.repository.model
import com.snk.HomeStock.api.dto.BoardDto
import jakarta.persistence.Column
import jakarta.persistence.Entity
import jakarta.persistence.Id
import jakarta.persistence.Table
import org.hibernate.annotations.CreationTimestamp
import org.hibernate.annotations.UpdateTimestamp
import java.time.OffsetDateTime
import java.util.UUID

import jakarta.persistence.OneToMany
import jakarta.persistence.FetchType
import jakarta.persistence.CascadeType

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
    var createdAt: OffsetDateTime? = null,

    @OneToMany(mappedBy = "board", orphanRemoval = true, fetch = FetchType.EAGER, cascade = [CascadeType.ALL])
    var assets: MutableList<BoardAsset> = mutableListOf()
) {
    fun toDto(): BoardDto {
        return BoardDto(
            id = id.toString(),
            name = name,
            height = height,
            width = width,
            previewsrc = previewsrc,
            last_update = lastUpdate?.toString(),
            created_at = createdAt?.toString(),
//            assets = assets,
            assets = emptyList()
        )
    }
}
