package com.homelab.core.model.auth

// The single "administration" capability a role can grant, distinct from the per-module moduleIds a
// role also carries. Granting it makes the holder an administrator-equivalent: they can do
// everything a full admin can, EXCEPT the two things reserved to the real administrator (isAdmin) -
// ejecting the administrator (deleting/transferring the admin account) and changing the
// administrator's own account (its roles). A user with isAdmin=true implicitly holds it (see
// PermissionService). This deliberately replaces the previous fine-grained set (MANAGE_ROLES,
// MOBILE_ACCESS, MODULE_START_STOP, MODULE_INSTALL) with one all-or-nothing grant.
enum class AdminPermission {
    // Administrator-equivalent access (see above). Also what the mobile app requires to sign in.
    ADMIN_ACCESS;

    companion object {
        private val byName = entries.associateBy { it.name }
        fun fromNameOrNull(name: String): AdminPermission? = byName[name]
    }
}

// Union of every administration permission [this] user effectively holds: all of them for a
// full admin, otherwise whatever their roles grant. Shared by PermissionService (authorization
// checks), UserDto (surfacing to the frontend) and JWT claim generation, so the three never drift.
fun User.effectiveAdminPermissions(): Set<String> =
    if (isAdmin) AdminPermission.entries.mapTo(mutableSetOf()) { it.name }
    else roles.flatMapTo(mutableSetOf()) { it.adminPermissions }
