package com.homelab.core.model.auth

// Fixed set of global "administration" capabilities a role can grant, distinct from the
// per-module moduleIds a role also carries. Unlike module access, these aren't tied to any
// installed module - they gate admin-panel sections and module lifecycle actions directly.
// A user with isAdmin=true implicitly holds every one of these (see PermissionService).
enum class AdminPermission {
    // Access to the "Role management" admin section: create/edit/delete roles. Does not include
    // granting/revoking a user's isAdmin status, which stays reserved to full admins.
    MANAGE_ROLES,

    // Access to the mobile app / mobile client.
    MOBILE_ACCESS,

    // Start/stop modules.
    MODULE_START_STOP,

    // Install (add) modules.
    MODULE_INSTALL;

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
