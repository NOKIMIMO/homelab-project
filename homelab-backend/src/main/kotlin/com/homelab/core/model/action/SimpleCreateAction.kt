package com.homelab.core.model.action

import com.homelab.core.helper.AppLogger
import com.homelab.core.service.AppletService
import com.homelab.sdk.action.Action
import com.homelab.sdk.data.GenericTableLayer
import com.homelab.sdk.module.action.ModuleActionDeclaration

class SimpleCreateAction: Action  {
    private val log = AppLogger.loggerFor(AppletService::class)

    override fun execute(
        moduleId: String,
        mergedParams: Map<String, Any>,
        genericObject: GenericTableLayer,
        declaration: ModuleActionDeclaration
    ): Any {

        return try {
            val created = genericObject.create(mergedParams)
            mapOf("created" to created)
        } catch (e: Exception) {
            log.error("[SimpleCreateAction] create via GenericTableLayer failed: ${e.message}", e)
            return if (e is com.homelab.core.exception.ApiException) {
                mapOf("created" to false, "error" to (e.message ?: "unknown"), "errorCode" to e.code)
            } else {
                mapOf("created" to false, "error" to (e.message ?: "unknown"))
            }
        }
    }
}