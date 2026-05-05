package com.homelab.core.controller

import com.homelab.core.config.HomelabConfig
import com.homelab.core.model.data.GenericTableLayer
import com.homelab.core.model.module.ModuleConfig
import com.homelab.core.model.module.action.ModuleActionDeclaration
import com.homelab.core.parser.ModuleDataObjectParser
import com.homelab.core.service.module.ModuleConfigService
import org.springframework.http.HttpStatus
import org.springframework.http.MediaType
import org.springframework.http.ResponseEntity
import org.springframework.web.bind.annotation.*
import org.springframework.web.multipart.MultipartFile
import java.io.File
import java.nio.file.Files
import java.nio.file.Path
import java.nio.file.StandardCopyOption
import java.util.UUID

@RestController
@RequestMapping("/api")
@CrossOrigin(origins = ["*"])
class AppletControler(
	private val moduleConfigService: ModuleConfigService,
	private val homelabConfig: HomelabConfig,
) {

	@GetMapping("/{id}")
	fun getModuleConfig(@PathVariable id: String): ResponseEntity<Any> {
		val discovered = moduleConfigService.scanModuleConfigs(homelabConfig.modulesScanPath)
		val found = discovered.find { it.config.id == id } ?: return ResponseEntity.status(HttpStatus.NOT_FOUND).body(mapOf("error" to "Module not found"))
		return ResponseEntity.ok(found.config)
	}

	@GetMapping("/{id}/{functionName}")
	fun getFunctionDeclaration(@PathVariable id: String, @PathVariable functionName: String): ResponseEntity<Any> {
		val discovered = moduleConfigService.scanModuleConfigs(homelabConfig.modulesScanPath)
		val found = discovered.find { it.config.id == id } ?: return ResponseEntity.status(HttpStatus.NOT_FOUND).body(mapOf("error" to "Module not found"))
		val decl = findFunction(found.config, functionName) ?: return ResponseEntity.status(HttpStatus.NOT_FOUND).body(mapOf("error" to "Function not found"))
		return ResponseEntity.ok(decl)
	}

	@PostMapping(
		"/{id}/{functionName}",
		consumes = [
			MediaType.APPLICATION_JSON_VALUE,
			MediaType.MULTIPART_FORM_DATA_VALUE
		]
	)
	fun invokeFunction(
		@PathVariable id: String,
		@PathVariable functionName: String,
		@RequestPart(required = false) params: Map<String, Any>?,
		@RequestParam(required = false) formParams: Map<String, String>?,
		@RequestPart(required = false, name = "file") file: MultipartFile?
	): ResponseEntity<Any> {
		val discovered = moduleConfigService.scanModuleConfigs(homelabConfig.modulesScanPath)
		val found = discovered.find { it.config.id == id } ?:
			return ResponseEntity.status(HttpStatus.NOT_FOUND).body(mapOf("error" to "Module not found"))
		val decl = findFunction(found.config, functionName) ?:
			return ResponseEntity.status(HttpStatus.NOT_FOUND).body(mapOf("error" to "Function not found"))

		val mergedParams = mutableMapOf<String, Any>()
		params?.let { mergedParams.putAll(it) }
		formParams?.let { mergedParams.putAll(it) }
		file?.let {
			mergedParams["file"] = mapOf(
				"name" to it.name,
				"originalFilename" to it.originalFilename,
				"contentType" to it.contentType,
				"size" to it.size,
			)
		}

		val resolvedLogic = decl.logic.map { logic ->
			val resolvedParams = logic.parameters?.mapValues { (_, v) ->
				// If the parameter maps to a parameter name (e.g. "filePath" -> "filePath"), substitute from the request body when present
				if (mergedParams.containsKey(v)) mergedParams[v]!! else v
			}
			mapOf("type" to logic.type, "parameters" to (resolvedParams ?: emptyMap<String, Any>()))
		}
		//Partira dans son service aprés

		// Get Table Definition
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
		val genericObject = GenericTableLayer(resolvedObject)

//		because action type is UPLOAD_FILE
	// first save file locally (in data/moduleid/) and then save in db using the generic layer

		val savedFilePath = file?.let {
			saveUploadedFile(id, it)
		}

		savedFilePath?.let {
			mergedParams["filePath"] = it
		}
//		genericObject.create()


		return ResponseEntity.ok(mapOf(
			"module" to found.config.id,
			"function" to decl.name,
			"actUponObject" to decl.actUponObject,
			"resolvedObject" to resolvedObject,
			"description" to decl.description,
			"providedParameters" to mergedParams,
			"resolvedLogic" to resolvedLogic
		))
	}

	private fun findFunction(config: ModuleConfig, functionName: String): ModuleActionDeclaration? {
		config.actions.forEach { action ->
			action.functions.forEach { f ->
				if (f.name == functionName) return f
			}
		}
		return null
	}

	// Sent to helper function later
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