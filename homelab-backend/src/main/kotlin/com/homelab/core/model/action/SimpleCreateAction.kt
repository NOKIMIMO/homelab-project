package com.homelab.core.model.action

import com.homelab.sdk.action.Action
import com.homelab.sdk.data.GenericTableLayer
import com.homelab.sdk.module.action.ModuleActionDeclaration

class SimpleCreateAction: Action  {
    override fun execute(
        moduleId: String,
        mergedParams: Map<String, Any>,
        genericObject: GenericTableLayer,
        declaration: ModuleActionDeclaration
    ): Any {
        println("[SimpleCreateAction] invoked for module=$moduleId} merged=${mergedParams.keys}")

        val created = try {
            genericObject.create(mergedParams)
        } catch (e: Exception) {
            println("[UploadFileAction] create via GenericTableLayer failed: ${e.message}")
            false
        }

        return mapOf("created" to created)
    }
}