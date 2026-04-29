package com.snk.HomeStock.domain.entity

import java.time.OffsetDateTime
import java.util.UUID

data class BoardClass(
    val id: UUID,
    val name: String,
    val height: Int,
    val width: Int,
    val previewsrc: String?,
    val lastUpdate: OffsetDateTime?,
    val createdAt: OffsetDateTime?
)