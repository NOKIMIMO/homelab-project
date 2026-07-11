package com.homelab.core.controller

import com.homelab.core.api.dto.modulebuilder.AddColumnRequest
import com.homelab.core.api.dto.modulebuilder.ModuleBuilderRequest
import com.homelab.core.service.module.ModuleBuilderService
import org.springframework.http.MediaType
import org.springframework.security.access.prepost.PreAuthorize
import org.springframework.web.bind.annotation.*
import org.springframework.web.multipart.MultipartFile

@RestController
@RequestMapping("/api/admin/module-builder")
@PreAuthorize("hasRole('ADMIN')")
@CrossOrigin(origins = ["*"])
class ModuleBuilderController(
    private val moduleBuilderService: ModuleBuilderService
) {

    @GetMapping
    fun listModules() = moduleBuilderService.listBuilderModules()

    @GetMapping("/{id}/schema")
    fun getSchema(@PathVariable id: String) = moduleBuilderService.getSchema(id)

    @GetMapping("/{id}/full")
    fun getFullSpec(@PathVariable id: String) = moduleBuilderService.getFullSpec(id)

    @PostMapping
    fun createModule(@RequestBody request: ModuleBuilderRequest) = moduleBuilderService.createModule(request)

    @PutMapping("/{id}")
    fun updateModule(
        @PathVariable id: String,
        @RequestBody request: ModuleBuilderRequest
    ) = moduleBuilderService.updateModule(id, request)

    @PostMapping("/{id}/icon", consumes = [MediaType.MULTIPART_FORM_DATA_VALUE])
    fun uploadIcon(
        @PathVariable id: String,
        @RequestPart("file") file: MultipartFile
    ) = moduleBuilderService.uploadIcon(id, file)

    @PostMapping("/{id}/ui-page", consumes = [MediaType.MULTIPART_FORM_DATA_VALUE])
    fun uploadUiPage(
        @PathVariable id: String,
        @RequestPart("file") file: MultipartFile
    ) = moduleBuilderService.uploadUiPage(id, file)

    @PostMapping("/{id}/ui-build", consumes = [MediaType.MULTIPART_FORM_DATA_VALUE])
    fun uploadUiBuild(
        @PathVariable id: String,
        @RequestPart("file") file: MultipartFile
    ) = moduleBuilderService.uploadUiBuild(id, file)

    @PostMapping("/{id}/tables/{table}/columns")
    fun addColumn(
        @PathVariable id: String,
        @PathVariable table: String,
        @RequestBody request: AddColumnRequest
    ) = moduleBuilderService.addColumn(id, request.copy(tableName = table))

    @DeleteMapping("/{id}")
    fun deleteModule(
        @PathVariable id: String,
        @RequestParam(defaultValue = "false") dropData: Boolean
    ): Map<String, Any> {
        moduleBuilderService.deleteModule(id, dropData)
        return mapOf("success" to true)
    }
}
