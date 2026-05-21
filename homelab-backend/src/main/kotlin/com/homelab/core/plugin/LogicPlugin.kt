package com.homelab.core.plugin

import com.homelab.core.model.action.Action

interface LogicPlugin {
    fun typeName(): String
    fun actionSingleton(): Action
}

