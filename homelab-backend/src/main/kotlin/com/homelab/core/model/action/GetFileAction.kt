package com.homelab.core.model.action

import com.homelab.core.model.data.GenericTableLayer
import java.nio.file.Files
import java.nio.file.Path

class GetFileAction : Action {
    override fun execute(
        moduleId: String,
        mergedParams: Map<String, Any>,
        actionParams: Map<String, Any>?,
        genericObject: GenericTableLayer
    ): Any? {
        println("[GetFileAction] invoked module=$moduleId params=${actionParams ?: mapOf()}")

        val filters = mutableMapOf<String, Any?>()
        if (mergedParams.containsKey("id")) filters["id"] = mergedParams["id"]

        val found = genericObject.find(filters)
        if (found.isEmpty()) return null

        val record = found.first()
        val filePath = (record["file"] ?: record["file_path"])?.toString() ?: return null
        val fileName = (record["file_name"] ?: record["fileName"] ?: record["originalFilename"])?.toString()

        val p = Path.of(filePath)
        if (!Files.exists(p)) {
            println("[GetFileAction] physical file not found at path: $filePath")
            return null
        }

        val contentType = Files.probeContentType(p) ?: "application/octet-stream"

        return mapOf("filePath" to filePath, "fileName" to (fileName ?: p.fileName.toString()), "contentType" to contentType)
    }
}

