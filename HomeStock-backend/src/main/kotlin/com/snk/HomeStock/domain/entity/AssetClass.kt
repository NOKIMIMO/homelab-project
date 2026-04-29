package com.snk.HomeStock.domain.entity

import com.fasterxml.jackson.databind.JsonNode
import java.time.OffsetDateTime

data class AssetClass(
    val id: Long?,
    val name: String,
    val metadata: JsonNode?,
    val datePhoto: OffsetDateTime?,
    val dateUpload: OffsetDateTime,
    val origin: String?
)