package com.homelab.core.model.auth

import jakarta.persistence.Column
import jakarta.persistence.Embeddable
import jakarta.persistence.EnumType
import jakarta.persistence.Enumerated
import java.time.DayOfWeek
import java.time.LocalTime

// A recurring weekly window during which a role's access is blocked (parental-control style).
// end < start means the window crosses midnight (e.g. 20:00 -> 07:00 the next morning).
@Embeddable
class BlockedWindow(
    @Enumerated(EnumType.STRING)
    @Column(name = "day_of_week", nullable = false, length = 10)
    var dayOfWeek: DayOfWeek = DayOfWeek.MONDAY,

    @Column(name = "start_time", nullable = false)
    var start: LocalTime = LocalTime.MIDNIGHT,

    @Column(name = "end_time", nullable = false)
    var end: LocalTime = LocalTime.MIDNIGHT
)
