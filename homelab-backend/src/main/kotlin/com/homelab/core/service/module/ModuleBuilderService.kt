package com.homelab.core.service.module

import com.fasterxml.jackson.databind.ObjectMapper
import com.homelab.core.action.ActionFactory
import com.homelab.core.api.dto.modulebuilder.AddColumnRequest
import com.homelab.core.api.dto.modulebuilder.ColumnSpec
import com.homelab.core.api.dto.modulebuilder.ExternalFetchSpec
import com.homelab.core.api.dto.modulebuilder.ModuleBuilderRequest
import com.homelab.core.api.dto.modulebuilder.ModuleBuilderSummary
import com.homelab.core.api.dto.modulebuilder.ModuleParamSpec
import com.homelab.core.api.dto.modulebuilder.ModuleSchemaResponse
import com.homelab.core.api.dto.modulebuilder.RelationSpec
import com.homelab.core.api.dto.modulebuilder.TableSpec
import com.homelab.core.config.HomelabConfig
import com.homelab.core.config.ModuleConfigMemory
import com.homelab.core.exception.BadRequestException
import com.homelab.core.exception.NotFoundException
import com.homelab.core.exception.PersistenceException
import com.homelab.core.parser.ModuleDataObjectParser
import com.homelab.sdk.data.Cardinality
import com.homelab.sdk.data.ColumnDefinition
import com.homelab.sdk.data.TableDefinition
import com.homelab.sdk.helper.AppLogger
import com.homelab.sdk.module.action.ModuleActionParameterType
import org.springframework.stereotype.Service
import java.io.File
import java.io.StringWriter
import javax.xml.parsers.DocumentBuilderFactory
import javax.xml.transform.OutputKeys
import javax.xml.transform.TransformerFactory
import javax.xml.transform.dom.DOMSource
import javax.xml.transform.stream.StreamResult

@Service
class ModuleBuilderService(
    private val homelabConfig: HomelabConfig,
    private val moduleService: ModuleService,
    private val moduleDatabaseService: ModuleDatabaseService,
    private val moduleConfigMemory: ModuleConfigMemory,
    private val objectMapper: ObjectMapper,
    private val actionFactory: ActionFactory
) {
    private val log = AppLogger.loggerFor(ModuleBuilderService::class)

    companion object {
        const val GENERATED_BY_MARKER = "module-builder"
        private const val BUILDER_SPEC_FILE = "builder.json"
        private val RESERVED_COLUMN_NAMES = setOf("id", "created_at", "updated_at", "file", "file_name")
        private val IDENTIFIER_REGEX = Regex("[a-z][a-z0-9_]*")
    }

    // -------------------------------------------------------------------
    // Public API
    // -------------------------------------------------------------------

    fun listBuilderModules(): List<ModuleBuilderSummary> {
        val root = File(homelabConfig.modulesScanPath)
        val dirs = root.listFiles { f -> f.isDirectory } ?: return emptyList()
        val plainMapper = ObjectMapper()

        return dirs.mapNotNull { dir ->
            val manifestFile = File(dir, "manifest.json")
            if (!manifestFile.exists()) return@mapNotNull null
            try {
                val node = plainMapper.readTree(manifestFile)
                ModuleBuilderSummary(
                    id = node.get("id")?.asText() ?: dir.name,
                    name = node.get("name")?.asText() ?: dir.name,
                    description = node.get("description")?.asText(),
                    custom = node.get("generatedBy")?.asText() == GENERATED_BY_MARKER
                )
            } catch (e: Exception) {
                log.warn("Failed reading manifest in '${dir.name}': ${e.message}")
                null
            }
        }
    }

    fun getSchema(moduleId: String): ModuleSchemaResponse {
        val directory = requireBuilderModuleDirectory(moduleId)
        val node = ObjectMapper().readTree(File(directory, "manifest.json"))

        val dataObjects = node.get("dataObjects")?.map { it.asText() } ?: emptyList()
        val tables = dataObjects.map { fileName ->
            val xmlFile = File(directory, fileName)
            toTableSpec(ModuleDataObjectParser.parseFromXml(xmlFile.readText(), moduleId))
        }

        return ModuleSchemaResponse(
            moduleId = moduleId,
            name = node.get("name")?.asText() ?: moduleId,
            description = node.get("description")?.asText(),
            tables = tables
        )
    }

    fun createModule(request: ModuleBuilderRequest): ModuleBuilderSummary {
        validateRequest(request)

        val moduleId = request.id.trim()
        val moduleDir = File(homelabConfig.modulesScanPath, moduleId)
        if (!moduleDir.mkdirs()) {
            throw PersistenceException("Could not create module directory for '$moduleId'")
        }

        try {
            for (table in request.tables) {
                File(moduleDir, "${table.name}.xml").writeText(buildTableXml(table))
            }

            objectMapper.writerWithDefaultPrettyPrinter()
                .writeValue(File(moduleDir, "manifest.json"), buildManifest(request))

            objectMapper.writerWithDefaultPrettyPrinter()
                .writeValue(File(moduleDir, uiPageFileName(moduleId)), buildUiPage(request))

            if (request.params.isNotEmpty()) {
                objectMapper.writerWithDefaultPrettyPrinter()
                    .writeValue(File(moduleDir, "params.json"), mapOf("parameters" to request.params))
            }

            // Raw source-of-truth for the edit flow: the generated manifest/XML lose information
            // (eg. external-fetch definitions, which XML has no tags for) that can't be reliably
            // reconstructed, so we keep the exact request that produced them.
            objectMapper.writerWithDefaultPrettyPrinter()
                .writeValue(File(moduleDir, BUILDER_SPEC_FILE), request)
        } catch (e: Exception) {
            moduleDir.deleteRecursively()
            throw PersistenceException("Failed generating module '$moduleId': ${e.message}", e)
        }

        moduleService.scanModules()

        return ModuleBuilderSummary(moduleId, request.name, request.description, custom = true)
    }

    // Full editable spec for the builder UI --- read back from the persisted request rather than
    // reverse-engineered from the generated manifest/UI JSON (which is lossy, see createModule()).
    fun getFullSpec(moduleId: String): ModuleBuilderRequest {
        val directory = requireBuilderModuleDirectory(moduleId)
        val specFile = File(directory, BUILDER_SPEC_FILE)
        if (!specFile.exists()) {
            throw NotFoundException("Module '$moduleId' has no stored builder spec and can't be edited this way")
        }
        return objectMapper.readValue(specFile, ModuleBuilderRequest::class.java)
    }

    fun updateModule(moduleId: String, request: ModuleBuilderRequest): ModuleBuilderSummary {
        val directory = requireBuilderModuleDirectory(moduleId)
        if (request.id.trim() != moduleId) {
            throw BadRequestException("Module id cannot be changed")
        }

        val specFile = File(directory, BUILDER_SPEC_FILE)
        if (!specFile.exists()) {
            throw NotFoundException("Module '$moduleId' has no stored builder spec and can't be edited this way")
        }
        val previous = objectMapper.readValue(specFile, ModuleBuilderRequest::class.java)

        validateRequest(request, isUpdate = true)

        val previousTablesByName = previous.tables.associateBy { it.name }
        val newTableKeys = request.tables.map { it.previousName?.takeIf(String::isNotBlank) ?: it.name }.toSet()
        val removedTables = previous.tables.map { it.name }.filter { it !in newTableKeys }
        if (removedTables.isNotEmpty()) {
            throw BadRequestException(
                "Removing tables (${removedTables.joinToString()}) isn't supported here; delete the whole module instead"
            )
        }

        for (table in request.tables) {
            val oldTableName = table.previousName?.takeIf(String::isNotBlank) ?: table.name
            val oldTable = previousTablesByName[oldTableName] ?: continue // brand-new table, nothing to reconcile

            if (table.name != oldTable.name) {
                // Block the rename if the table is referenced by a relation either before or
                // after this edit (checking both old and new target-table spellings) --- the FK
                // column name is derived from the "one" side's table name, so a rename would
                // silently desync it from the manifest's declared parameter name otherwise.
                val stillReferenced = (previous.tables + request.tables).any { other ->
                    other.name != oldTable.name && other.name != table.name &&
                        other.relations.any { it.targetTable == oldTable.name || it.targetTable == table.name }
                }
                if (stillReferenced) {
                    throw BadRequestException(
                        "Cannot rename table '${oldTable.name}': another table has a relation pointing at it. Remove that relation first."
                    )
                }
                moduleDatabaseService.renameTable(moduleId, oldTable.name, table.name)
                File(directory, "${oldTable.name}.xml").delete()
            }

            val oldColumnsByName = oldTable.columns.associateBy { it.name }
            val newColumnKeys = mutableSetOf<String>()
            for (col in table.columns) {
                val oldColName = col.previousName?.takeIf(String::isNotBlank) ?: col.name
                newColumnKeys.add(oldColName)
                val oldCol = oldColumnsByName[oldColName]

                if (oldCol == null) {
                    // Brand-new column on an existing table: same nullable-only rule as the
                    // dedicated "add column" flow, since Postgres rejects NOT NULL against rows
                    // that may already exist.
                    val added = moduleDatabaseService.addColumn(
                        moduleId, table.name,
                        ColumnDefinition(col.name, col.type, col.unique, true, col.regex)
                    )
                    if (!added) throw PersistenceException("Failed adding column '${col.name}' to table '${table.name}'")
                    continue
                }
                if (col.name != oldCol.name) {
                    moduleDatabaseService.renameColumn(moduleId, table.name, oldCol.name, col.name)
                }
                if (col.type != oldCol.type) {
                    moduleDatabaseService.retypeColumn(moduleId, table.name, col.name, col.type)
                }
            }

            val removedColumns = oldTable.columns.map { it.name }.filter { it !in newColumnKeys }
            if (removedColumns.isNotEmpty()) {
                throw BadRequestException(
                    "Removing columns (${removedColumns.joinToString()}) isn't supported on table '${table.name}'; leave them in place"
                )
            }
        }

        try {
            for (table in request.tables) {
                File(directory, "${table.name}.xml").writeText(buildTableXml(table))
            }

            objectMapper.writerWithDefaultPrettyPrinter()
                .writeValue(File(directory, "manifest.json"), buildManifest(request))

            objectMapper.writerWithDefaultPrettyPrinter()
                .writeValue(File(directory, uiPageFileName(moduleId)), buildUiPage(request))

            val paramsFile = File(directory, "params.json")
            if (request.params.isNotEmpty()) {
                objectMapper.writerWithDefaultPrettyPrinter()
                    .writeValue(paramsFile, mapOf("parameters" to request.params))
            } else if (paramsFile.exists()) {
                paramsFile.delete()
            }

            objectMapper.writerWithDefaultPrettyPrinter().writeValue(specFile, request)
        } catch (e: Exception) {
            throw PersistenceException("Failed saving changes to module '$moduleId': ${e.message}", e)
        }

        // New tables/relations/constraints are picked up by the normal scan pipeline (same as
        // creation); renamed/retyped columns and tables were already applied above via direct ALTERs.
        moduleService.scanModules()

        return ModuleBuilderSummary(moduleId, request.name, request.description, custom = true)
    }

    fun addColumn(moduleId: String, request: AddColumnRequest): ModuleSchemaResponse {
        val directory = requireBuilderModuleDirectory(moduleId)

        val tableName = validateIdentifier(request.tableName, "Table")
        val columnName = validateIdentifier(request.column.name, "Column")
        if (columnName in RESERVED_COLUMN_NAMES) {
            throw BadRequestException("Column name '$columnName' is reserved")
        }

        val xmlFile = File(directory, "$tableName.xml")
        if (!xmlFile.exists()) {
            throw NotFoundException("Table '$tableName' not found in module '$moduleId'")
        }

        val existingDefinition = ModuleDataObjectParser.parseFromXml(xmlFile.readText(), moduleId)
        if (existingDefinition.columns.any { it.name == columnName }) {
            throw BadRequestException("Column '$columnName' already exists on table '$tableName'")
        }

        // Columns added after creation must be nullable: Postgres would reject NOT NULL
        // against a table that may already contain rows.
        val newColumnSpec = request.column.copy(name = columnName, nullable = true, previousName = null)
        val updatedSpec = toTableSpec(existingDefinition)
            .let { it.copy(columns = it.columns + newColumnSpec) }

        xmlFile.writeText(buildTableXml(updatedSpec))

        val newColumnDefinition = ColumnDefinition(
            columnName,
            newColumnSpec.type,
            newColumnSpec.unique,
            true,
            newColumnSpec.regex
        )
        val added = moduleDatabaseService.addColumn(moduleId, tableName, newColumnDefinition)
        if (!added) {
            throw PersistenceException("Failed to add column '$columnName' to table '$tableName'")
        }

        // Keep the persisted builder spec and the generated manifest/UI page in sync: otherwise
        // the new column isn't declared as a callable parameter on create/update/list, and a
        // later edit (which regenerates everything from the persisted spec) would silently
        // revert this table's XML to drop the column again.
        val specFile = File(directory, BUILDER_SPEC_FILE)
        if (specFile.exists()) {
            val currentSpec = objectMapper.readValue(specFile, ModuleBuilderRequest::class.java)
            val updatedRequest = currentSpec.copy(
                tables = currentSpec.tables.map { t ->
                    if (t.name == tableName) t.copy(columns = t.columns + newColumnSpec) else t
                }
            )
            objectMapper.writerWithDefaultPrettyPrinter()
                .writeValue(File(directory, "manifest.json"), buildManifest(updatedRequest))
            objectMapper.writerWithDefaultPrettyPrinter()
                .writeValue(File(directory, uiPageFileName(moduleId)), buildUiPage(updatedRequest))
            objectMapper.writerWithDefaultPrettyPrinter().writeValue(specFile, updatedRequest)
            moduleService.scanModules()
        }

        return getSchema(moduleId)
    }

    // Unlike getSchema/getFullSpec/updateModule/addColumn, deletion doesn't touch the builder.json
    // spec, so it isn't restricted to builder-created modules: any module directory discovered by
    // the normal scan (moduleConfigMemory) can be removed here, matching listBuilderModules()
    // which already lists every module, custom or not.
    fun deleteModule(moduleId: String, dropData: Boolean) {
        val directory = moduleConfigMemory.getDirectory(moduleId)
            ?: throw NotFoundException("Module '$moduleId' not found")

        moduleService.unregisterModule(moduleId)

        if (dropData) {
            moduleDatabaseService.dropModuleSchema(moduleId)
        }

        directory.deleteRecursively()
    }

    // -------------------------------------------------------------------
    // Validation
    // -------------------------------------------------------------------

    private fun requireBuilderModuleDirectory(moduleId: String): File {
        val directory = moduleConfigMemory.getDirectory(moduleId)
            ?: throw NotFoundException("Module '$moduleId' not found")
        val manifestFile = File(directory, "manifest.json")
        if (!manifestFile.exists()) throw NotFoundException("Module '$moduleId' not found")

        val node = ObjectMapper().readTree(manifestFile)
        if (node.get("generatedBy")?.asText() != GENERATED_BY_MARKER) {
            throw BadRequestException("Module '$moduleId' was not created by the module builder")
        }
        return directory
    }

    private fun validateIdentifier(raw: String, kind: String): String {
        val trimmed = raw.trim()
        if (!trimmed.matches(IDENTIFIER_REGEX)) {
            throw BadRequestException(
                "$kind name '$raw' must start with a lowercase letter and contain only lowercase letters, digits and underscores"
            )
        }
        return trimmed
    }

    private fun validateRequest(request: ModuleBuilderRequest, isUpdate: Boolean = false) {
        val moduleId = validateIdentifier(request.id, "Module id")
        if (request.name.isBlank()) throw BadRequestException("Module name must not be empty")
        if (request.tables.isEmpty()) throw BadRequestException("A module needs at least one table")

        if (!isUpdate) {
            val moduleDir = File(homelabConfig.modulesScanPath, moduleId)
            if (moduleDir.exists()) throw BadRequestException("A module directory already exists for id '$moduleId'")
        }

        val tableNames = mutableSetOf<String>()
        for (table in request.tables) {
            val tableName = validateIdentifier(table.name, "Table")
            if (!tableNames.add(tableName)) throw BadRequestException("Duplicate table name '$tableName'")

            val colNames = mutableSetOf<String>()
            for (col in table.columns) {
                val colName = validateIdentifier(col.name, "Column")
                if (colName in RESERVED_COLUMN_NAMES) {
                    throw BadRequestException("Column name '$colName' is reserved (table '$tableName')")
                }
                if (!colNames.add(colName)) {
                    throw BadRequestException("Duplicate column name '$colName' in table '$tableName'")
                }
            }

            for (group in table.uniqueTogether) {
                if (group.size < 2) {
                    throw BadRequestException("uniqueTogether groups need at least 2 fields (table '$tableName')")
                }
            }

            val generatedNames = mutableSetOf("list$", "get$", "create$", "update$", "delete$")
                .map { it.replace("$", tableName.pascal()) }.toMutableSet()
            for (fetch in table.externalFetches) {
                if (fetch.functionName.isBlank()) {
                    throw BadRequestException("External fetch function name must not be empty (table '$tableName')")
                }
                if (!generatedNames.add(fetch.functionName)) {
                    throw BadRequestException("Function name '${fetch.functionName}' collides with another function on table '$tableName'")
                }
                if (fetch.urlTemplate.isBlank()) {
                    throw BadRequestException("External fetch '${fetch.functionName}' needs a urlTemplate")
                }
                if (fetch.responseMapping.isEmpty()) {
                    throw BadRequestException("External fetch '${fetch.functionName}' needs at least one responseMapping entry")
                }
            }

            val availableActionTypes = actionFactory.getAvailableActionTypes()
            for (fn in table.customFunctions) {
                if (fn.name.isBlank()) {
                    throw BadRequestException("Custom function name must not be empty (table '$tableName')")
                }
                if (!generatedNames.add(fn.name)) {
                    throw BadRequestException("Function name '${fn.name}' collides with another function on table '$tableName'")
                }
                if (fn.logic.isEmpty()) {
                    throw BadRequestException("Custom function '${fn.name}' needs at least one action step")
                }
                for (step in fn.logic) {
                    if (step.actionType !in availableActionTypes) {
                        throw BadRequestException(
                            "Custom function '${fn.name}' uses unknown action type '${step.actionType}'"
                        )
                    }
                }
            }
        }

        for (table in request.tables) {
            for (rel in table.relations) {
                if (rel.targetTable !in tableNames) {
                    throw BadRequestException(
                        "Relation target table '${rel.targetTable}' not found in this module (table '${table.name}')"
                    )
                }
            }
        }

        val paramKeys = mutableSetOf<String>()
        for (param in request.params) {
            if (param.key.isBlank()) throw BadRequestException("Module parameter key must not be empty")
            if (!paramKeys.add(param.key)) throw BadRequestException("Duplicate module parameter key '${param.key}'")
        }
    }

    // -------------------------------------------------------------------
    // Relation FK helpers
    //
    // Which table receives the generated "<other>_id" FK column depends on cardinality
    // (mirrors ObjectRelationUpdater): ONE_TO_MANY puts the FK on the *target* table,
    // while MANY_TO_ONE / ONE_TO_ONE put it on the *declaring* table itself.
    // MANY_TO_MANY uses a join table and isn't exposed through the generated CRUD.
    // -------------------------------------------------------------------

    private fun computeExtraFkParams(table: TableSpec, allTables: List<TableSpec>): List<String> {
        val extra = mutableListOf<String>()

        table.relations.forEach { rel ->
            when (rel.cardinality) {
                Cardinality.MANY_TO_ONE, Cardinality.ONE_TO_ONE -> extra.add("${rel.targetTable}_id")
                else -> {}
            }
        }

        allTables.forEach { other ->
            if (other.name == table.name) return@forEach
            other.relations.forEach { rel ->
                if (rel.cardinality == Cardinality.ONE_TO_MANY && rel.targetTable == table.name) {
                    extra.add("${other.name}_id")
                }
            }
        }

        return extra.distinct()
    }

    // -------------------------------------------------------------------
    // manifest.json generation
    // -------------------------------------------------------------------

    private fun uiPageFileName(moduleId: String) = "${moduleId}_ui.json"

    private fun String.pascal(): String = replaceFirstChar { it.uppercase() }

    private fun functionParam(name: String, type: ModuleActionParameterType, description: String, optional: Boolean): Map<String, Any?> =
        mapOf(
            "name" to name,
            "type" to type.name,
            "description" to description,
            "optional" to optional
        )

    private fun buildFunctionsForTable(table: TableSpec, allTables: List<TableSpec>): List<Map<String, Any?>> {
        val xmlFile = "${table.name}.xml"
        val cap = table.name.pascal()
        val extraFkParams = computeExtraFkParams(table, allTables)
        val functions = mutableListOf<Map<String, Any?>>()

        functions += mapOf(
            "name" to "list$cap",
            "description" to "List rows of ${table.name}.",
            "parameters" to table.columns.map { functionParam(it.name, ModuleActionParameterType.EQUAL, "Filter by ${it.name}", true) } +
                extraFkParams.map { functionParam(it, ModuleActionParameterType.EQUAL, "Filter by $it", true) },
            "logic" to listOf(mapOf("type" to "LIST")),
            "actUponObject" to xmlFile
        )

        functions += mapOf(
            "name" to "get$cap",
            "description" to "Get a row of ${table.name} by id.",
            "parameters" to listOf(functionParam("id", ModuleActionParameterType.EQUAL, "Row identifier", false)),
            "logic" to listOf(mapOf("type" to "READ")),
            "actUponObject" to xmlFile
        )

        functions += mapOf(
            "name" to "create$cap",
            "description" to "Create a row in ${table.name}.",
            "parameters" to table.columns.map { functionParam(it.name, ModuleActionParameterType.NONE, "Value of ${it.name}", it.nullable) } +
                extraFkParams.map { functionParam(it, ModuleActionParameterType.NONE, "Reference to $it", true) },
            "logic" to listOf(mapOf("type" to "CREATE")),
            "actUponObject" to xmlFile
        )

        functions += mapOf(
            "name" to "update$cap",
            "description" to "Update a row of ${table.name}.",
            "parameters" to listOf(functionParam("id", ModuleActionParameterType.EQUAL, "Identifier of the row to update", false)) +
                table.columns.map { functionParam(it.name, ModuleActionParameterType.NONE, "New value of ${it.name}", true) } +
                extraFkParams.map { functionParam(it, ModuleActionParameterType.NONE, "Reference to $it", true) },
            "logic" to listOf(mapOf("type" to "UPDATE")),
            "actUponObject" to xmlFile
        )

        functions += mapOf(
            "name" to "delete$cap",
            "description" to "Delete a row of ${table.name}.",
            "parameters" to listOf(functionParam("id", ModuleActionParameterType.EQUAL, "Identifier of the row to delete", false)),
            "logic" to listOf(mapOf("type" to "DELETE")),
            "actUponObject" to xmlFile
        )

        if (table.enableFileStorage) {
            functions += mapOf(
                "name" to "upload${cap}File",
                "description" to "Add a file to ${table.name}.",
                "parameters" to listOf(functionParam("filePath", ModuleActionParameterType.EQUAL, "File path", false)),
                "logic" to listOf(mapOf("type" to "UPLOAD_FILE")),
                "actUponObject" to xmlFile
            )
            functions += mapOf(
                "name" to "get${cap}File",
                "description" to "Retrieve the file of a row of ${table.name}.",
                "parameters" to listOf(functionParam("id", ModuleActionParameterType.EQUAL, "Row identifier", false)),
                "logic" to listOf(mapOf("type" to "GET_FILE")),
                "actUponObject" to xmlFile
            )
        }

        for (fetch in table.externalFetches) {
            functions += mapOf(
                "name" to fetch.functionName,
                "description" to fetch.description.ifBlank { "Retrieve external data for ${table.name}." },
                "parameters" to fetch.queryParams.map {
                    functionParam(it, ModuleActionParameterType.NONE, "Query parameter $it", false)
                },
                "logic" to listOf(
                    mapOf(
                        "type" to "FETCH_EXTERNAL_GENERIC",
                        "params" to mapOf(
                            "urlTemplate" to fetch.urlTemplate,
                            "responseMapping" to fetch.responseMapping,
                            "upsertKey" to fetch.upsertKey
                        )
                    )
                ),
                "actUponObject" to xmlFile
            )
        }

        for (fn in table.customFunctions) {
            functions += mapOf(
                "name" to fn.name,
                "description" to fn.description.ifBlank { "Custom function." },
                "parameters" to fn.parameters.map { functionParam(it.name, it.type, it.description, it.optional) },
                "logic" to fn.logic.map { mapOf("type" to it.actionType, "params" to it.params) },
                "actUponObject" to xmlFile
            )
        }

        return functions
    }

    private fun buildManifest(request: ModuleBuilderRequest): Map<String, Any?> {
        val actions = request.tables.map { table ->
            mapOf(
                "visual" to "${table.name}.xml",
                "functions" to buildFunctionsForTable(table, request.tables)
            )
        }

        return mapOf(
            "id" to request.id,
            "name" to request.name,
            "version" to "1.0.0",
            "icon" to "module.svg",
            "description" to request.description,
            "generatedBy" to GENERATED_BY_MARKER,
            "actions" to actions,
            "uIFormat" to "JSON",
            "page" to uiPageFileName(request.id),
            "dataObjects" to request.tables.map { "${it.name}.xml" },
            "dependencies" to null,
            "permissions" to listOf("read:${request.id}", "write:${request.id}", "delete:${request.id}")
        )
    }

    // -------------------------------------------------------------------
    // UI page generation --- reuses only existing declarative components
    // -------------------------------------------------------------------

    private fun buildUiPage(request: ModuleBuilderRequest): Map<String, Any?> = buildAutoTablePage(request)

    private fun buildAutoTablePage(request: ModuleBuilderRequest): Map<String, Any?> {
        val state = mutableMapOf<String, Any?>()
        val bindings = mutableMapOf<String, Any?>()
        val components = mutableListOf<Any?>()

        components += mapOf("type" to "Header", "props" to mapOf("title" to request.name))

        for (table in request.tables) {
            val cap = table.name.pascal()
            val listFn = "list$cap"
            val createFn = "create$cap"
            val deleteFn = "delete$cap"

            bindings[listFn] = listFn
            bindings[createFn] = createFn
            bindings[deleteFn] = deleteFn

            val extraFk = computeExtraFkParams(table, request.tables)
            val fieldNames = table.columns.map { it.name } + extraFk

            components += mapOf("type" to "Header", "props" to mapOf("title" to table.name))

            val createParams = mutableMapOf<String, Any?>()
            val formInputs = mutableListOf<Any?>()
            for (fieldName in fieldNames) {
                val stateKey = "new_${table.name}_$fieldName"
                state[stateKey] = ""
                formInputs += mapOf(
                    "type" to "TextInput",
                    "props" to mapOf("label" to fieldName, "placeholder" to fieldName, "stateKey" to stateKey)
                )
                createParams[fieldName] = "{{$stateKey}}"
            }
            formInputs += mapOf(
                "type" to "Button",
                "props" to mapOf("label" to "Add", "icon" to "plus"),
                "action" to listOf(
                    mapOf("action" to createFn, "method" to "POST", "params" to createParams),
                    mapOf("action" to listFn, "method" to "POST")
                )
            )
            components += mapOf("type" to "ActionBar", "components" to formInputs)

            components += mapOf(
                "type" to "ActionBar",
                "components" to listOf(
                    mapOf(
                        "type" to "Button",
                        "props" to mapOf("label" to "Refresh", "icon" to "refresh"),
                        "action" to mapOf("action" to listFn, "method" to "POST")
                    )
                )
            )

            val titleField = table.columns.firstOrNull()?.name ?: "id"
            components += mapOf(
                "type" to "List",
                "props" to mapOf("emptyMessage" to "No rows."),
                "source" to mapOf("binding" to listFn, "method" to "POST"),
                "item" to mapOf(
                    "type" to "ListItem",
                    "props" to mapOf("title" to "{{$titleField}}", "subtitle" to "ID: {{id}}"),
                    "actions" to listOf(
                        mapOf(
                            "type" to "IconButton",
                            "props" to mapOf("icon" to "trash", "tooltip" to "Delete"),
                            "action" to listOf(
                                mapOf("action" to deleteFn, "method" to "POST", "params" to mapOf("id" to "{{id}}")),
                                mapOf("action" to listFn, "method" to "POST")
                            )
                        )
                    )
                )
            )
        }

        return mapOf(
            "page" to mapOf(
                "id" to "${request.id}_page",
                "layout" to "vertical",
                "bindings" to bindings,
                "state" to state,
                "components" to components
            )
        )
    }

    // -------------------------------------------------------------------
    // XML (de)serialization --- mirrors ModuleDataObjectParser's expected tags
    // -------------------------------------------------------------------

    private fun toTableSpec(definition: TableDefinition): TableSpec {
        return TableSpec(
            name = definition.name,
            columns = definition.columns.map { ColumnSpec(it.name, it.type, it.nullable, it.unique, it.regex) },
            enableFileStorage = definition.autoGeneratedColumns.any { it.type == com.homelab.sdk.data.AutoGeneratedType.FILE },
            relations = definition.relations.map { RelationSpec(it.targetTable, it.cardinality, it.cascadeDelete) },
            uniqueTogether = definition.uniqueTogether.map { it.fields }
        )
    }

    private fun buildTableXml(table: TableSpec): String {
        val builder = DocumentBuilderFactory.newInstance().newDocumentBuilder()
        val doc = builder.newDocument()

        val root = doc.createElement(table.name)
        doc.appendChild(root)

        val autoGen = doc.createElement("autoGenerated")
        autoGen.appendChild(doc.createElement("id"))
        autoGen.appendChild(doc.createElement("createdAt"))
        autoGen.appendChild(doc.createElement("updatedAt"))
        if (table.enableFileStorage) autoGen.appendChild(doc.createElement("file"))
        root.appendChild(autoGen)

        for (col in table.columns) {
            val colEl = doc.createElement("col")

            val naming = doc.createElement("naming")
            naming.setAttribute("val", col.name)
            colEl.appendChild(naming)

            val typing = doc.createElement("typing")
            typing.setAttribute("val", col.type.name)
            if (!col.regex.isNullOrBlank()) {
                val regexEl = doc.createElement("regex")
                regexEl.setAttribute("val", col.regex)
                typing.appendChild(regexEl)
            }
            colEl.appendChild(typing)

            if (col.unique) {
                val uniqueEl = doc.createElement("unique")
                uniqueEl.setAttribute("val", "true")
                colEl.appendChild(uniqueEl)
            }

            val nullableEl = doc.createElement("nullable")
            nullableEl.setAttribute("val", col.nullable.toString())
            colEl.appendChild(nullableEl)

            root.appendChild(colEl)
        }

        for (rel in table.relations) {
            val linksTo = doc.createElement("linksTo")

            val targetObject = doc.createElement("targetObject")
            targetObject.textContent = rel.targetTable
            linksTo.appendChild(targetObject)

            val cardinality = doc.createElement("cardinality")
            cardinality.textContent = when (rel.cardinality) {
                Cardinality.ONE_TO_ONE -> "one-to-one"
                Cardinality.ONE_TO_MANY -> "one-to-many"
                Cardinality.MANY_TO_ONE -> "many-to-one"
                Cardinality.MANY_TO_MANY -> "many-to-many"
            }
            linksTo.appendChild(cardinality)

            val cascadeDelete = doc.createElement("cascadeDelete")
            cascadeDelete.textContent = rel.cascadeDelete.toString()
            linksTo.appendChild(cascadeDelete)

            val cascadeUpdate = doc.createElement("cascadeUpdate")
            cascadeUpdate.textContent = "false"
            linksTo.appendChild(cascadeUpdate)

            root.appendChild(linksTo)
        }

        if (table.uniqueTogether.isNotEmpty()) {
            val constraints = doc.createElement("constraints")
            table.uniqueTogether.forEachIndexed { idx, fields ->
                val uniqueTogether = doc.createElement("uniqueTogether")
                uniqueTogether.setAttribute("name", "uq_${table.name}_$idx")
                for (f in fields) {
                    val fieldEl = doc.createElement("field")
                    fieldEl.textContent = f
                    uniqueTogether.appendChild(fieldEl)
                }
                constraints.appendChild(uniqueTogether)
            }
            root.appendChild(constraints)
        }

        val transformer = TransformerFactory.newInstance().newTransformer()
        transformer.setOutputProperty(OutputKeys.INDENT, "yes")
        transformer.setOutputProperty(OutputKeys.OMIT_XML_DECLARATION, "yes")
        transformer.setOutputProperty("{http://xml.apache.org/xslt}indent-amount", "4")

        val writer = StringWriter()
        transformer.transform(DOMSource(doc), StreamResult(writer))
        return writer.toString()
    }
}
