package com.homelab.core.model.action

import com.homelab.core.model.data.GenericTableLayer

interface Action {
    /**
     * Execute the action.
     * @param moduleId module id where the action runs
     * @param mergedParams the full request params (including file if uploaded)
     * @param actionParams the per-action parameters (from module action logic, already resolved by controller)
     * @param genericObject the GenericTableLayer representing the data object
     * @return arbitrary result suitable for returning to caller (nullable)
     */
    fun execute(
        moduleId: String,
        mergedParams: Map<String, Any>,
        actionParams: Map<String, Any>?,
        genericObject: GenericTableLayer
    ): Any?
}