package com.homelab.core.service

import com.homelab.core.config.HomelabConfig
import com.homelab.core.model.action.ActionsEnum
import com.homelab.core.model.data.GenericTableLayer
import com.homelab.core.model.module.action.ModuleActionDeclaration
import com.homelab.core.parser.ModuleDataObjectParser
import com.homelab.core.service.module.ModuleDatabaseService
import org.springframework.stereotype.Service
import org.springframework.web.multipart.MultipartFile
import java.io.File
import java.nio.file.Files
import java.nio.file.Path
import java.nio.file.StandardCopyOption
import java.util.UUID

@Service
class AppletService(
    private val moduleDatabaseService: ModuleDatabaseService,
    private val homelabConfig: HomelabConfig
) {

    fun invokeFunctionOfModule(
        id: String,
        mergedParams: Map<String, Any>,
        decl: ModuleActionDeclaration,
        resolvedLogic: List<Map<String, Any>>): Map<String, Any?>{

        val resolvedObject = decl.actUponObject.let { obj ->
            val file = File(
                homelabConfig.modulesScanPath,
                "$id/$obj"
            ).canonicalFile
            if (!file.exists()) {
                error("Data object XML not found: ${file.absolutePath}")
            }
            val xml = file.readText()
            ModuleDataObjectParser.parseFromXml(xml)
        }

        val genericObject = GenericTableLayer(
            resolvedObject,
            moduleDatabaseService = moduleDatabaseService,
            moduleId = id
        )

        val actionReturn = mutableMapOf<String, Any?>()
        for (actions in resolvedLogic) {
            val actionType = actions["type"] as String
            val returnValue = when (actionType) {
//                ActionsEnum.CREATE.name -> genericObject.create(actions["data"] as Map<String, Any>) //TODO: finish the simple create for simpler/generic data object
                ActionsEnum.UPLOAD_FILE.name -> actionUploadFile(id, mergedParams, genericObject)
                ActionsEnum.GET_FILE.name -> actionRetrieveFile(id, mergedParams, genericObject)
                ActionsEnum.DELETE.name -> actionDelete(id, mergedParams, genericObject)
                ActionsEnum.LIST.name -> genericObject.find(getFilters(null))
                ActionsEnum.READ.name -> actionRead(id, mergedParams, genericObject)
                else -> {}
            }
            actionReturn[actionType] = returnValue

        }
        return mapOf("success" to true, "data" to actionReturn)
    }
    private fun getFilters(filters : Map<String, Any>?): Map<String, Any> {
        // return empty map if no filters
        if (filters == null){
            return mapOf()
        }
        return filters
    }

    private fun actionRetrieveFile(moduleId: String, mergedParams: Map<String, Any>, genericObject: GenericTableLayer): Map<String, Any?>?{
        val filters = mutableMapOf<String, Any?>()
        when {
            //TODO: add support for ModuleConfig of the function call

            //TODO: add suport for created_at + updated_at
            mergedParams.containsKey("id") -> filters["id"] = mergedParams["id"]
        }

        val found = genericObject.find(filters)
        if (found.isEmpty()) {
            return null
        }

        val record = found.first()
        val filePath = (record["file"] ?: record["file_path"])?.toString()
        val fileName = (record["file_name"] ?: record["fileName"] ?: record["originalFilename"])?.toString()

        if (filePath == null) return null

        val p = Path.of(filePath)
        if (!Files.exists(p)) {
            println("Physical file not found at path: $filePath")
            return null
        }

        val contentType = Files.probeContentType(p) ?: "application/octet-stream"

        return mapOf("filePath" to filePath, "fileName" to (fileName ?: p.fileName.toString()), "contentType" to contentType)
    }

    private fun actionDelete(moduleId: String, mergedParams: Map<String, Any>, genericObject: GenericTableLayer): Map<String, Any?>? {
        val filters = mutableMapOf<String, Any?>()
        when {
            mergedParams.containsKey("id") -> filters["id"] = mergedParams["id"]
        }

        val deleted = genericObject.deleteByFilters(filters)
        return mapOf("deleted" to deleted)
    }

    private fun actionRead(moduleId: String, mergedParams: Map<String, Any>, genericObject: GenericTableLayer): Any? {
        val filters = mutableMapOf<String, Any?>()
        if (mergedParams.containsKey("id")) filters["id"] = mergedParams["id"]

        for ((k, v) in mergedParams) {
            if (!filters.containsKey(k) && v is String) {
                filters[k] = v
            }
        }

        val rows = genericObject.find(filters)
        val sanitized = rows.map { row ->
            val copy = row.toMutableMap()
            copy.remove("file")
            copy.remove("filePath")
            copy.remove("file_path")
            copy
        }
        return mapOf("rows" to sanitized)
    }

    private fun actionUploadFile(moduleId: String, mergedParams: Map<String, Any>, genericObject: GenericTableLayer){
        val filePath = saveUploadedFile(moduleId, mergedParams["file"] as MultipartFile)
        val fileName = (mergedParams["file"] as MultipartFile).originalFilename

        val dataToCreate = mapOf(
            "file" to mapOf(
                "file" to filePath,
                "file_name" to fileName
            )
        )

        genericObject.create(dataToCreate)
    }

    private fun saveUploadedFile(
        moduleId: String,
        file: MultipartFile
    ): String {
        val uploadDir = Path.of("data", moduleId).toAbsolutePath().normalize()
        Files.createDirectories(uploadDir)

        val originalName = file.originalFilename ?: "upload.bin"
        val safeOriginalName = originalName
            .substringAfterLast("/")
            .substringAfterLast("\\")
            .replace(Regex("[^a-zA-Z0-9._-]"), "_")

        val storedFileName = "${UUID.randomUUID()}_$safeOriginalName"
        val targetPath = uploadDir.resolve(storedFileName).normalize()

        require(targetPath.startsWith(uploadDir)) {
            "Invalid file path"
        }

        file.inputStream.use { input ->
            Files.copy(input, targetPath, StandardCopyOption.REPLACE_EXISTING)
        }

        return targetPath.toString()
    }
}