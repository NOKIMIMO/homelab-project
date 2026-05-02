package com.homelab.core.controller

import com.homelab.core.config.HomelabConfig
import com.homelab.core.model.module.ModuleConfig
import com.homelab.core.model.module.action.ModuleActionDeclaration
import com.homelab.core.service.module.ModuleConfigService
import org.springframework.http.HttpStatus
import org.springframework.http.ResponseEntity
import org.springframework.web.bind.annotation.*

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

	@PostMapping("/{id}/{functionName}")
	fun invokeFunction(
		@PathVariable id: String,
		@PathVariable functionName: String,
		@RequestBody(required = false) params: Map<String, Any>?
	): ResponseEntity<Any> {
		val discovered = moduleConfigService.scanModuleConfigs(homelabConfig.modulesScanPath)
		val found = discovered.find { it.config.id == id } ?: return ResponseEntity.status(HttpStatus.NOT_FOUND).body(mapOf("error" to "Module not found"))
		val decl = findFunction(found.config, functionName) ?: return ResponseEntity.status(HttpStatus.NOT_FOUND).body(mapOf("error" to "Function not found"))

		val resolvedLogic = decl.logic.map { logic ->
			val resolvedParams = logic.parameters?.mapValues { (_, v) ->
				// If the parameter maps to a parameter name (e.g. "filePath" -> "filePath"), substitute from the request body when present
				if (params != null && params.containsKey(v)) params[v]!! else v
			}
			mapOf("type" to logic.type, "parameters" to (resolvedParams ?: emptyMap<String, Any>()))
		}

		return ResponseEntity.ok(mapOf(
			"module" to found.config.id,
			"function" to decl.name,
			"description" to decl.description,
			"providedParameters" to (params ?: emptyMap<String, Any>()),
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

}