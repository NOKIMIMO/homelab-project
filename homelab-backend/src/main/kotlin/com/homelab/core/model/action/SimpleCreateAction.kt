package com.homelab.core.model.action

import com.homelab.sdk.helper.AppLogger
import com.homelab.core.service.AppletService
import com.homelab.sdk.action.Action
import com.homelab.sdk.data.GenericTableLayer
import com.homelab.sdk.module.action.ModuleActionDeclaration

class SimpleCreateAction: Action  {
    private val log = AppLogger.loggerFor(SimpleCreateAction::class)

    override fun execute(
        moduleId: String,
        mergedParams: Map<String, Any>,
        genericObject: GenericTableLayer,
        declaration: ModuleActionDeclaration
    ): Any {
        log.debug("Executing SimpleCreateAction for module $moduleId with mergedParams: $mergedParams and declaration: ${declaration.name}")

        return try {
            val created = genericObject.create(mergedParams)
            mapOf("created" to created)
        } catch (e: Exception) {
            log.error("create via GenericTableLayer failed: ${e.message}", e)
            return if (e is com.homelab.core.exception.ApiException) {
                mapOf("created" to false, "error" to (e.message ?: "unknown"), "errorCode" to e.code)
            } else {
                mapOf("created" to false, "error" to (e.message ?: "unknown"))
            }
        }
    }
}