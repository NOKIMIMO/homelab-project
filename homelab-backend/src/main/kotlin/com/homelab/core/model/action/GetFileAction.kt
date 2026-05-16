package com.homelab.core.model.action

import com.homelab.core.model.data.GenericTableLayer
import java.nio.file.Files
import java.nio.file.Path

class GetFileAction : Action {
    override fun execute(
        moduleId: String,
        mergedParams: Map<String, Any>,
        genericObject: GenericTableLayer,
        declaration: com.homelab.core.model.module.action.ModuleActionDeclaration
    ): Any {
        println("[GetFileAction] invoked module=$moduleId")

        val filters = getFilters(mergedParams,declaration)

        val found = genericObject.find(filters)
        if (found.isEmpty()) return mapOf("success" to false, "filePath" to null, "fileName" to null, "contentType" to null)

        val record = found.first()
        val filePath = (record["file"] ?: record["file_path"])?.toString() ?: return mapOf("success" to false, "filePath" to null, "fileName" to null, "contentType" to null)
        val fileName = (record["file_name"] ?: record["fileName"] ?: record["originalFilename"])?.toString()

        val p = Path.of(filePath)
        if (!Files.exists(p)) {
            println("[GetFileAction] physical file not found at path: $filePath")
            return mapOf("success" to false, "filePath" to filePath, "fileName" to (fileName ?: p.fileName.toString()), "contentType" to null)
        }

        val contentType = Files.probeContentType(p) ?: "application/octet-stream"

        return mapOf("success" to true,"filePath" to filePath, "fileName" to (fileName ?: p.fileName.toString()), "contentType" to contentType)
    }
}

