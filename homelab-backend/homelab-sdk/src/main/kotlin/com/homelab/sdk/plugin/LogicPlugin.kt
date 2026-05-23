package com.homelab.sdk.plugin

import com.homelab.sdk.action.Action

/**
 * Plugin provider interface used by ServiceLoader in plugin JARs.
 */
interface LogicPlugin {
    fun typeName(): String
    fun actionSingleton(): Action
}

