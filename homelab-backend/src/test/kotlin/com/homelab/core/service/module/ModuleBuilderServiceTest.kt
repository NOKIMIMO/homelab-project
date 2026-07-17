package com.homelab.core.service.module

import com.fasterxml.jackson.module.kotlin.registerKotlinModule
import com.fasterxml.jackson.databind.ObjectMapper
import com.homelab.core.action.ActionFactory
import com.homelab.core.api.dto.modulebuilder.AddColumnRequest
import com.homelab.core.api.dto.modulebuilder.ColumnSpec
import com.homelab.core.api.dto.modulebuilder.CustomFunctionParamSpec
import com.homelab.core.api.dto.modulebuilder.CustomFunctionSpec
import com.homelab.core.api.dto.modulebuilder.ExternalFetchSpec
import com.homelab.core.api.dto.modulebuilder.LogicStepSpec
import com.homelab.core.api.dto.modulebuilder.ModuleBuilderRequest
import com.homelab.core.api.dto.modulebuilder.RelationSpec
import com.homelab.core.api.dto.modulebuilder.TableSpec
import com.homelab.core.config.HomelabConfig
import com.homelab.core.config.ModuleConfigMemory
import com.homelab.core.exception.BadRequestException
import com.homelab.core.exception.NotFoundException
import com.homelab.core.model.module.ModuleConfig
import com.homelab.core.model.module.UIFormat
import com.homelab.sdk.data.Cardinality
import com.homelab.sdk.data.ColumnTyping
import org.junit.jupiter.api.Assertions.assertEquals
import org.junit.jupiter.api.Assertions.assertThrows
import org.junit.jupiter.api.Assertions.assertTrue
import org.junit.jupiter.api.BeforeEach
import org.junit.jupiter.api.Test
import org.mockito.Mockito.mock
import org.mockito.Mockito.`when`
import org.mockito.kotlin.any
import org.mockito.kotlin.eq
import org.springframework.core.env.Environment
import java.io.File
import java.nio.file.Files

class ModuleBuilderServiceTest {

    private lateinit var moduleService: ModuleService
    private lateinit var moduleDatabaseService: ModuleDatabaseService
    private lateinit var moduleConfigMemory: ModuleConfigMemory
    private lateinit var homelabConfig: HomelabConfig
    private lateinit var actionFactory: ActionFactory
    private lateinit var service: ModuleBuilderService
    private lateinit var scanRoot: File

    private fun dummyConfig(id: String) = ModuleConfig(
        id = id, name = id, version = "1.0", icon = "icon.svg",
        actions = emptyList(), dataObjects = emptyList(), uIFormat = UIFormat.API, page = null, dependencies = emptyList()
    )

    @BeforeEach
    fun setUp() {
        moduleService = mock(ModuleService::class.java)
        moduleDatabaseService = mock(ModuleDatabaseService::class.java)
        moduleConfigMemory = ModuleConfigMemory()
        scanRoot = Files.createTempDirectory("module-builder-service-test").toFile()
        homelabConfig = HomelabConfig(mock(Environment::class.java))
        homelabConfig.modulesScanPath = scanRoot.absolutePath
        actionFactory = mock(ActionFactory::class.java)
        `when`(actionFactory.getAvailableActionTypes())
            .thenReturn(listOf("CREATE", "LIST", "READ", "UPDATE", "DELETE", "UPLOAD_FILE", "GET_FILE", "FETCH_EXTERNAL_GENERIC"))
        service = ModuleBuilderService(
            homelabConfig, moduleService, moduleDatabaseService, moduleConfigMemory,
            ObjectMapper().registerKotlinModule(), actionFactory
        )
    }

    private fun simpleRequest(id: String = "notes", tableName: String = "notes") = ModuleBuilderRequest(
        id = id,
        name = "Notes",
        description = "A notes module",
        tables = listOf(
            TableSpec(name = tableName, columns = listOf(ColumnSpec(name = "title", type = ColumnTyping.string)))
        )
    )

    @Test
    fun `createModule rejects an invalid module id`() {
        val request = simpleRequest(id = "Not Valid!")

        assertThrows(BadRequestException::class.java) { service.createModule(request) }
    }

    @Test
    fun `createModule rejects a blank module name`() {
        val request = simpleRequest().copy(name = "  ")

        assertThrows(BadRequestException::class.java) { service.createModule(request) }
    }

    @Test
    fun `createModule rejects a request with no tables`() {
        val request = simpleRequest().copy(tables = emptyList())

        assertThrows(BadRequestException::class.java) { service.createModule(request) }
    }

    @Test
    fun `createModule rejects a module id that already exists on disk`() {
        File(scanRoot, "notes").mkdirs()

        assertThrows(BadRequestException::class.java) { service.createModule(simpleRequest()) }
    }

    @Test
    fun `createModule rejects duplicate table names`() {
        val request = simpleRequest().copy(
            tables = listOf(TableSpec(name = "notes"), TableSpec(name = "notes"))
        )

        assertThrows(BadRequestException::class.java) { service.createModule(request) }
    }

    @Test
    fun `createModule rejects a reserved column name`() {
        val request = simpleRequest().copy(
            tables = listOf(TableSpec(name = "notes", columns = listOf(ColumnSpec(name = "created_at", type = ColumnTyping.string))))
        )

        assertThrows(BadRequestException::class.java) { service.createModule(request) }
    }

    @Test
    fun `createModule rejects a relation pointing at an unknown table`() {
        val request = simpleRequest().copy(
            tables = listOf(
                TableSpec(
                    name = "notes",
                    relations = listOf(RelationSpec(targetTable = "does-not-exist", cardinality = Cardinality.MANY_TO_ONE))
                )
            )
        )

        assertThrows(BadRequestException::class.java) { service.createModule(request) }
    }

    @Test
    fun `createModule rejects an external fetch missing a urlTemplate`() {
        val request = simpleRequest().copy(
            tables = listOf(
                TableSpec(
                    name = "notes",
                    externalFetches = listOf(ExternalFetchSpec(functionName = "fetchSomething", urlTemplate = "", responseMapping = mapOf("a" to "b")))
                )
            )
        )

        assertThrows(BadRequestException::class.java) { service.createModule(request) }
    }

    @Test
    fun `createModule rejects a custom function using an unknown action type`() {
        val request = simpleRequest().copy(
            tables = listOf(
                TableSpec(
                    name = "notes",
                    customFunctions = listOf(
                        CustomFunctionSpec(name = "doStuff", logic = listOf(LogicStepSpec(actionType = "NOT_A_REAL_ACTION")))
                    )
                )
            )
        )

        assertThrows(BadRequestException::class.java) { service.createModule(request) }
    }

    @Test
    fun `createModule includes a valid custom function in the generated manifest`() {
        val request = simpleRequest().copy(
            tables = listOf(
                TableSpec(
                    name = "notes",
                    columns = listOf(ColumnSpec(name = "title", type = ColumnTyping.string)),
                    customFunctions = listOf(
                        CustomFunctionSpec(
                            name = "archiveNote",
                            description = "Archives a note.",
                            parameters = listOf(CustomFunctionParamSpec(name = "id", optional = false)),
                            logic = listOf(LogicStepSpec(actionType = "UPDATE", params = mapOf("status" to "archived")))
                        )
                    )
                )
            )
        )

        service.createModule(request)

        val manifestNode = ObjectMapper().readTree(File(scanRoot, "notes/manifest.json"))
        val functionNames = manifestNode.get("actions").first().get("functions").map { it.get("name").asText() }
        assertTrue(functionNames.contains("archiveNote"))
    }

    @Test
    fun `createModule writes the manifest table xml and ui page then triggers a rescan`() {
        val summary = service.createModule(simpleRequest())

        assertEquals("notes", summary.id)
        assertTrue(summary.custom)
        val moduleDir = File(scanRoot, "notes")
        assertTrue(File(moduleDir, "manifest.json").exists())
        assertTrue(File(moduleDir, "notes.xml").exists())
        assertTrue(File(moduleDir, "notes_ui.json").exists())
        assertTrue(File(moduleDir, "builder.json").exists())

        val manifestNode = ObjectMapper().readTree(File(moduleDir, "manifest.json"))
        assertEquals("module-builder", manifestNode.get("generatedBy").asText())
        org.mockito.Mockito.verify(moduleService).scanModules()
    }

    @Test
    fun `requireBuilderModuleDirectory throws NotFoundException for an unknown module`() {
        assertThrows(NotFoundException::class.java) { service.getSchema("does-not-exist") }
    }

    @Test
    fun `requireBuilderModuleDirectory rejects a module not created by the builder`() {
        val dir = File(scanRoot, "weather").apply { mkdirs() }
        File(dir, "manifest.json").writeText("""{"id":"weather","name":"weather","dataObjects":[]}""")
        moduleConfigMemory.put("weather", dummyConfig("weather"), dir)

        assertThrows(BadRequestException::class.java) { service.getSchema("weather") }
    }

    @Test
    fun `getFullSpec returns the persisted request for a builder-created module`() {
        service.createModule(simpleRequest())
        moduleConfigMemory.put("notes", dummyConfig("notes"), File(scanRoot, "notes"))

        val spec = service.getFullSpec("notes")

        assertEquals("notes", spec.id)
        assertEquals(1, spec.tables.size)
    }

    @Test
    fun `addColumn rejects a column that already exists on the table`() {
        service.createModule(simpleRequest())
        moduleConfigMemory.put("notes", dummyConfig("notes"), File(scanRoot, "notes"))

        assertThrows(BadRequestException::class.java) {
            service.addColumn("notes", AddColumnRequest("notes", ColumnSpec(name = "title", type = ColumnTyping.string)))
        }
    }

    @Test
    fun `addColumn adds a new nullable column and persists the database change`() {
        service.createModule(simpleRequest())
        moduleConfigMemory.put("notes", dummyConfig("notes"), File(scanRoot, "notes"))
        `when`(moduleDatabaseService.addColumn(eq("notes"), eq("notes"), any()))
            .thenReturn(true)

        val schema = service.addColumn("notes", AddColumnRequest("notes", ColumnSpec(name = "body", type = ColumnTyping.string, nullable = false)))

        assertTrue(schema.tables.first().columns.any { it.name == "body" && it.nullable })
    }

    @Test
    fun `deleteModule unregisters the module and removes its directory`() {
        service.createModule(simpleRequest())
        val dir = File(scanRoot, "notes")
        moduleConfigMemory.put("notes", dummyConfig("notes"), dir)

        service.deleteModule("notes", dropData = false)

        org.mockito.Mockito.verify(moduleService).unregisterModule("notes")
        assertTrue(!dir.exists())
    }

    @Test
    fun `deleteModule drops the database schema only when requested`() {
        service.createModule(simpleRequest())
        val dir = File(scanRoot, "notes")
        moduleConfigMemory.put("notes", dummyConfig("notes"), dir)

        service.deleteModule("notes", dropData = true)

        org.mockito.Mockito.verify(moduleDatabaseService).dropModuleSchema("notes")
    }
}
