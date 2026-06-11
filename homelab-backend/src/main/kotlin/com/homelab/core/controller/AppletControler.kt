package com.homelab.core.controller

import com.homelab.core.config.HomelabConfig
import com.homelab.core.model.module.ModuleConfig
import com.homelab.sdk.module.action.ModuleActionDeclaration
import com.homelab.core.service.AppletService
import com.homelab.core.service.module.ModuleConfigService
import com.homelab.core.service.module.ModuleService
import org.springframework.core.io.FileSystemResource
import org.springframework.http.HttpHeaders
import org.springframework.http.HttpStatus
import org.springframework.http.MediaType
import org.springframework.http.ResponseEntity
import com.homelab.sdk.helper.AppLogger
import org.springframework.web.bind.annotation.*
import org.springframework.web.multipart.MultipartFile
import java.nio.file.Path

@RestController
@RequestMapping("/api")
@CrossOrigin(origins = ["*"])
class AppletControler(
	private val moduleConfigService: ModuleConfigService,
	private val homelabConfig: HomelabConfig,
	private val appletService: AppletService,
	private val moduleService: ModuleService
) {

	private val log = AppLogger.loggerFor(AppletControler::class)

	@GetMapping("/{id}")
	fun getModuleConfig(@PathVariable id: String): ResponseEntity<Any> {
		val discovered = moduleConfigService.scanModuleConfigs(homelabConfig.modulesScanPath)
		val found = discovered.find { it.config.id == id } ?: return ResponseEntity.status(HttpStatus.NOT_FOUND).body(mapOf("error" to "Module not found"))
		return ResponseEntity.ok(
			mapOf(
				"started" to moduleService.isModuleRunning(id),
				"config" to found.config)
		)
	}

	@GetMapping("/{id}/{functionName}")
	fun getFunctionDeclaration(@PathVariable id: String, @PathVariable functionName: String): ResponseEntity<Any> {
		val discovered = moduleConfigService.scanModuleConfigs(homelabConfig.modulesScanPath)
		val found = discovered.find { it.config.id == id } ?: return ResponseEntity.status(HttpStatus.NOT_FOUND).body(mapOf("error" to "Module not found"))
		val decl = findFunction(found.config, functionName) ?: return ResponseEntity.status(HttpStatus.NOT_FOUND).body(mapOf("error" to "Function not found"))
		return ResponseEntity.ok(decl)
	}

 	@PostMapping("/{id}/{functionName}", consumes = [MediaType.APPLICATION_JSON_VALUE])
 	fun invokeFunctionJson(
		@PathVariable id: String,
		@PathVariable functionName: String,
		@RequestBody(required = false) body: Map<String, Any>?,
		@RequestParam(required = false) formParams: Map<String, String>?
	): ResponseEntity<Any> {
		log.info("Simple JSON call")
		val mergedParams = mutableMapOf<String, Any>()
		body?.let { mergedParams.putAll(it) }
		formParams?.let { mergedParams.putAll(it) }
		log.debug("mergeParams initial: ${mergedParams.keys}")
		log.debug("function: ${functionName}")
		return doInvoke(id, functionName, mergedParams)
	}

 	@PostMapping("/{id}/{functionName}", consumes = [MediaType.MULTIPART_FORM_DATA_VALUE])
 	fun invokeFunctionMultipart(
		@PathVariable id: String,
		@PathVariable functionName: String,
		@RequestPart(required = false, name = "params") params: Map<String, Any>?,
		@RequestParam(required = false) formParams: Map<String, String>?,
		@RequestPart(required = false, name = "file") file: MultipartFile?
	): ResponseEntity<Any> {
		log.info("MultiPart File call")
		val mergedParams = mutableMapOf<String, Any>()
		params?.let { mergedParams.putAll(it) }
		formParams?.let { mergedParams.putAll(it) }
		log.debug("mergeParams initial: ${mergedParams.keys}")
		file?.let {
			mergedParams["file"] = it
			mergedParams["file_meta"] = mapOf(
				"name" to it.name,
				"originalFilename" to it.originalFilename,
				"contentType" to it.contentType,
				"size" to it.size,
			)
		}
		return doInvoke(id, functionName, mergedParams)
	}

	private fun doInvoke(id: String, functionName: String, mergedParams: MutableMap<String, Any>): ResponseEntity<Any> {
		val discovered = moduleConfigService.scanModuleConfigs(homelabConfig.modulesScanPath)
		val found = discovered.find { it.config.id == id } ?:
			return ResponseEntity.status(HttpStatus.NOT_FOUND).body(mapOf("error" to "Module not found"))
		if (!moduleService.isModuleRunning(id)){
			log.warn("Module is not running")
			return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(mapOf("error" to "Module $id is not running, please start it first"))
		}
		val decl = findFunction(found.config, functionName) ?:
			return ResponseEntity.status(HttpStatus.NOT_FOUND).body(mapOf("error" to "Function not found"))

		val resolvedLogic = decl.logic.map { logic ->
			mapOf("type" to logic.type)
		}
		log.debug("Resolved logic: $resolvedLogic")
		val serviceResult: Map<String, Any?>
		try {
			serviceResult = appletService.invokeFunctionOfModule(id, mergedParams, decl, resolvedLogic)
		} catch (e: Exception) {
			log.error("Failed to invoke function: ${e.message}", e)
			return ResponseEntity.ok(mapOf(
				"success" to false,
				"module" to found.config.id,
				"function" to decl.name,
				"description" to decl.description,
				"error" to e.message
			))
		}

		// Check if the result is a file path
		// if so return a download response
		val fileInfo = findFileInfo(serviceResult)
		val filePath = fileInfo?.get("filePath") as? String
		if (filePath != null) {
			val fileName = (fileInfo["fileName"] as? String) ?: Path.of(filePath).fileName.toString()
			val contentType = (fileInfo["contentType"] as? String) ?: MediaType.APPLICATION_OCTET_STREAM_VALUE
			val resource = FileSystemResource(filePath)
			if (!resource.exists()) {
				return ResponseEntity.status(HttpStatus.NOT_FOUND).body(mapOf("error" to "File not found"))
			}
			return ResponseEntity.ok()
				.contentType(MediaType.parseMediaType(contentType))
				.header(HttpHeaders.CONTENT_DISPOSITION, "attachment; filename=\"$fileName\"")
				.body(resource)
		}

		return ResponseEntity.ok(mapOf(
			"success" to (serviceResult["success"] as? Boolean ?: true),
			"module" to found.config.id,
			"function" to decl.name,
			"description" to decl.description,
			"result" to serviceResult
		))
	}

	private fun findFileInfo(obj: Any?): Map<String, Any?>? {
		if (obj == null) return null
		if (obj is Map<*, *>) {
			if (obj.containsKey("filePath")) {
				return obj.entries
					.filter { it.key is String }
					.associate { it.key as String to it.value }
			}
			for ((_, v) in obj) {
				val found = findFileInfo(v)
				if (found != null) return found
			}
		}
		return null
	}

	private fun findFunction(config: ModuleConfig, functionName: String): ModuleActionDeclaration? {
		config.actions.forEach { action ->
			action.functions.forEach { f ->
				if (f.name == functionName) return f
			}
		}
		return null
	}
}