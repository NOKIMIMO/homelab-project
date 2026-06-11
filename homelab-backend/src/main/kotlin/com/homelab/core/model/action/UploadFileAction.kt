package com.homelab.core.model.action

import com.homelab.sdk.helper.AppLogger
import com.homelab.core.service.AppletService
import com.homelab.sdk.data.GenericTableLayer
import org.springframework.web.multipart.MultipartFile
import java.nio.file.Files
import java.nio.file.Path
import java.nio.file.StandardCopyOption
import java.util.UUID
import com.homelab.sdk.action.Action
import com.homelab.sdk.module.action.ModuleActionDeclaration

class UploadFileAction : Action {
    private val log = AppLogger.loggerFor(UploadFileAction::class)

    override fun execute(
        moduleId: String,
        mergedParams: Map<String, Any>,
        genericObject: GenericTableLayer,
        declaration: ModuleActionDeclaration
    ): Any {

        val fileObj = when {
//            actionParams?.containsKey("file") == true -> actionParams["file"]
            mergedParams.containsKey("file") -> mergedParams["file"]
            else -> null
        }
        log.debug("[UploadFileAction] received fileObj: $fileObj")

        if (fileObj !is MultipartFile) {
            log.warn("[UploadFileAction] no MultipartFile provided in params")
            return mapOf("created" to false, "reason" to "no file")
        }

        val uploadDir = Path.of("module_storage", moduleId).toAbsolutePath().normalize()
        try {
            Files.createDirectories(uploadDir)
        } catch (e: Exception) {
            log.error("[UploadFileAction] failed to create upload dir: ${e.message}")
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
            log.warn("[UploadFileAction] attempted path traversal attack: $originalName")
            return mapOf("created" to false, "reason" to "invalid_path")
        }

        try {
            fileObj.inputStream.use { input ->
                Files.copy(input, targetPath, StandardCopyOption.REPLACE_EXISTING)
            }
        } catch (e: Exception) {
            log.error("[UploadFileAction] failed to save uploaded file: ${e.message}")
            return mapOf("created" to false, "reason" to "save_failed")
        }

        val dataToCreate = mapOf(
            "file" to mapOf(
                "file" to targetPath.toString(),
                "file_name" to fileObj.originalFilename
            )
        )

        val createdResult = try {
            val created = genericObject.create(dataToCreate)
            mapOf("created" to created, "path" to targetPath.toString())
        } catch (e: Exception) {
            log.error("[UploadFileAction] failed to create record in GenericTableLayer: ${e.message}", e)
            if (e is com.homelab.core.exception.ApiException) {
                mapOf("created" to false, "path" to targetPath.toString(), "error" to (e.message ?: "unknown"), "errorCode" to e.code)
            } else {
                mapOf("created" to false, "path" to targetPath.toString(), "error" to (e.message ?: "unknown"))
            }
        }

        return createdResult
    }
}

