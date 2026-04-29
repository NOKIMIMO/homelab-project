package com.snk.HomeStock.domain

import jakarta.persistence.Column
import jakarta.persistence.Entity
import jakarta.persistence.Id
import jakarta.persistence.Table
import java.time.OffsetDateTime
import java.time.ZoneOffset
import java.util.UUID

@Entity
@Table(name = "synchro")
class Synchro(
    @Id
    var id: UUID = UUID.randomUUID(),

    @Column(nullable = false)
    var date: OffsetDateTime = OffsetDateTime.now(ZoneOffset.UTC)
)
