package com.homelab.core.model.action

import com.homelab.core.helper.AppLogger
import com.homelab.core.service.AppletService
import com.homelab.sdk.data.GenericTableLayer
import com.homelab.sdk.action.Action
import com.homelab.sdk.module.action.ModuleActionDeclaration
import java.nio.file.Files
import java.nio.file.Path

class GetFileAction : Action {

    private val log = AppLogger.loggerFor(GetFileAction::class)

    override fun execute(
        moduleId: String,
        mergedParams: Map<String, Any>,
        genericObject: GenericTableLayer,
        declaration: ModuleActionDeclaration
    ): Any {

        val filters = getFilters(mergedParams,declaration)

        val found = genericObject.find(filters)
        if (found.isEmpty()) return mapOf("success" to false, "filePath" to null, "fileName" to null, "contentType" to null)

        val record = found.first()
        val filePath = (record["file"] ?: record["file_path"])?.toString() ?: return mapOf("success" to false, "filePath" to null, "fileName" to null, "contentType" to null)
        val fileName = (record["file_name"] ?: record["fileName"] ?: record["originalFilename"])?.toString()

        val p = Path.of(filePath)
        if (!Files.exists(p)) {
            log.warn("[GetFileAction] physical file not found at path: $filePath")
            return mapOf("success" to false, "filePath" to filePath, "fileName" to (fileName ?: p.fileName.toString()), "contentType" to null)
        }

        val contentType = Files.probeContentType(p) ?: "application/octet-stream"

        return mapOf("success" to true,"filePath" to filePath, "fileName" to (fileName ?: p.fileName.toString()), "contentType" to contentType)
    }
}

