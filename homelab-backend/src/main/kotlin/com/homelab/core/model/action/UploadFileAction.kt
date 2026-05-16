package com.homelab.core.model.action

import com.homelab.core.model.data.GenericTableLayer
import org.springframework.web.multipart.MultipartFile
import java.nio.file.Files
import java.nio.file.Path
import java.nio.file.StandardCopyOption
import java.util.UUID

class UploadFileAction : Action {
    override fun execute(
        moduleId: String,
        mergedParams: Map<String, Any>,
        genericObject: GenericTableLayer,
        declaration: com.homelab.core.model.module.action.ModuleActionDeclaration
    ): Any {
        println("[UploadFileAction] invoked for module=$moduleId} merged=${mergedParams.keys}")

        val fileObj = when {
//            actionParams?.containsKey("file") == true -> actionParams["file"]
            mergedParams.containsKey("file") -> mergedParams["file"]
            else -> null
        }

        if (fileObj !is MultipartFile) {
            println("[UploadFileAction] no MultipartFile provided")
            return mapOf("created" to false, "reason" to "no file")
        }

        val uploadDir = Path.of("data", moduleId).toAbsolutePath().normalize()
        try {
            Files.createDirectories(uploadDir)
        } catch (e: Exception) {
            println("[UploadFileAction] failed to create upload dir: ${e.message}")
            return mapOf("created" to false, "reason" to "mkdir_failed")
        }

        val originalName = fileObj.originalFilename ?: "upload.bin"
        val safeOriginalName = originalName
            .substringAfterLast("/")
            .substringAfterLast("\\")
            .replace(Regex("[^a-zA-Z0-9._-]"), "_")

        val storedFileName = "${UUID.randomUUID()}_$safeOriginalName"
        val targetPath = uploadDir.resolve(storedFileName).normalize()

        if (!targetPath.startsWith(uploadDir)) {
            println("[UploadFileAction] invalid target path: $targetPath")
            return mapOf("created" to false, "reason" to "invalid_path")
        }

        try {
            fileObj.inputStream.use { input ->
                Files.copy(input, targetPath, StandardCopyOption.REPLACE_EXISTING)
            }
        } catch (e: Exception) {
            println("[UploadFileAction] failed to save uploaded file: ${e.message}")
            return mapOf("created" to false, "reason" to "save_failed")
        }

        val dataToCreate = mapOf(
            "file" to mapOf(
                "file" to targetPath.toString(),
                "file_name" to fileObj.originalFilename
            )
        )

        val created = try {
            genericObject.create(dataToCreate)
        } catch (e: Exception) {
            println("[UploadFileAction] create via GenericTableLayer failed: ${e.message}")
            false
        }

        return mapOf("created" to created, "path" to targetPath.toString())
    }
}

