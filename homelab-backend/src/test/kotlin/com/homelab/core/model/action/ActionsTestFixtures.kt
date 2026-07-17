package com.homelab.core.model.action

import com.homelab.sdk.module.action.ModuleActionDeclaration
import com.homelab.sdk.module.action.ModuleActionLogic
import com.homelab.sdk.module.action.ModuleActionParameter
import com.homelab.sdk.module.action.ModuleActionParameterType

internal fun testDeclaration(
    parameters: List<ModuleActionParameter> = listOf(
        ModuleActionParameter(name = "id", type = ModuleActionParameterType.EQUAL)
    ),
    logic: List<ModuleActionLogic> = listOf(ModuleActionLogic(type = "NOOP"))
): ModuleActionDeclaration = ModuleActionDeclaration(
    name = "test-action",
    description = "",
    parameters = parameters,
    logic = logic,
    actUponObject = "items"
)
