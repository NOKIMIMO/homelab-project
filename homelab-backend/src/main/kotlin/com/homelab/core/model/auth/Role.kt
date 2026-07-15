package com.homelab.core.model.auth

import jakarta.persistence.*
import java.time.DayOfWeek
import java.time.LocalDateTime

// A named bundle of module access rights. A user holding a role may use every module listed in
// [moduleIds] (all of that module's declared actions), except during a [blockedWindows] slot.
// Enforced by PermissionService.canInvoke.
@Entity
@Table(name = "roles")
class Role(
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    val id: Long? = null,

    @Column(nullable = false, unique = true, length = 100)
    var name: String = "",

    @ElementCollection(fetch = FetchType.EAGER)
    @CollectionTable(name = "role_modules", joinColumns = [JoinColumn(name = "role_id")])
    @Column(name = "module_id")
    var moduleIds: MutableSet<String> = mutableSetOf(),

    // At most one blocked window per day of week. Empty = never blocked (access 24/7).
    @ElementCollection(fetch = FetchType.EAGER)
    @CollectionTable(name = "role_blocked_windows", joinColumns = [JoinColumn(name = "role_id")])
    var blockedWindows: MutableList<BlockedWindow> = mutableListOf(),

    @Column(nullable = false)
    val createdAt: LocalDateTime = LocalDateTime.now(),

    @Column(nullable = false)
    var updatedAt: LocalDateTime = LocalDateTime.now()
) {

    // True when access should be blocked at [dt], honoring windows that cross midnight.
    fun isBlockedAt(dt: LocalDateTime): Boolean {
        val time = dt.toLocalTime()
        windowFor(dt.dayOfWeek)?.let { w ->
            if (w.start <= w.end) {
                if (time >= w.start && time < w.end) return true
            } else if (time >= w.start) {
                return true // evening part of an overnight window
            }
        }
        // an overnight window opened the day before still blocks this morning
        windowFor(dt.dayOfWeek.minus(1))?.let { w ->
            if (w.start > w.end && time < w.end) return true
        }
        return false
    }

    private fun windowFor(day: DayOfWeek): BlockedWindow? = blockedWindows.firstOrNull { it.dayOfWeek == day }
}
