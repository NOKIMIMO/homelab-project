package com.homelab.core.service

import com.homelab.core.action.ActionFactory
import com.homelab.core.config.HomelabConfig
import com.homelab.core.service.module.ModuleDatabaseService
import com.homelab.sdk.action.Action
import com.homelab.sdk.data.GenericTableLayer
import com.homelab.sdk.module.action.ModuleActionDeclaration
import com.homelab.sdk.module.action.ModuleActionLogic
import com.homelab.sdk.module.action.ModuleActionParameter
import com.homelab.sdk.module.action.ModuleActionParameterType
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

class AppletServiceTest {

    private lateinit var moduleDatabaseService: ModuleDatabaseService
    private lateinit var homelabConfig: HomelabConfig
    private lateinit var actionFactory: ActionFactory
    private lateinit var service: AppletService
    private lateinit var scanRoot: File

    @BeforeEach
    fun setUp() {
        moduleDatabaseService = mock(ModuleDatabaseService::class.java)
        actionFactory = mock(ActionFactory::class.java)
        scanRoot = Files.createTempDirectory("applet-service-test").toFile()
        homelabConfig = HomelabConfig(mock(Environment::class.java))
        homelabConfig.modulesScanPath = scanRoot.absolutePath
        service = AppletService(moduleDatabaseService, homelabConfig, actionFactory)
    }

    private fun declaration(
        parameters: List<ModuleActionParameter> = emptyList(),
        actUponObject: String = "photos.xml"
    ) = ModuleActionDeclaration(
        name = "list-photos",
        description = "",
        parameters = parameters,
        logic = listOf(ModuleActionLogic(type = "LIST")),
        actUponObject = actUponObject
    )

    @Test
    fun `invokeFunctionOfModule reports missing required parameters without touching the filesystem`() {
        val decl = declaration(
            parameters = listOf(ModuleActionParameter(name = "id", type = ModuleActionParameterType.NONE, optional = false))
        )

        val result = service.invokeFunctionOfModule("photos", emptyMap(), decl, emptyList())

        assertEquals(false, result["success"])
        @Suppress("UNCHECKED_CAST")
        val errors = result["errors"] as List<String>
        assertTrue(errors.any { it.contains("id") })
    }

    @Test
    fun `invokeFunctionOfModule throws when the source object XML file is missing`() {
        val decl = declaration(actUponObject = "does-not-exist.xml")

        assertThrows(IllegalStateException::class.java) {
            service.invokeFunctionOfModule("photos", emptyMap(), decl, emptyList())
        }
    }

    @Test
    fun `invokeFunctionOfModule resolves and executes the requested action logic against the source object`() {
        val moduleDir = File(scanRoot, "photos").apply { mkdirs() }
        File(moduleDir, "photos.xml").writeText(
            """
            <object>
                <naming val="photos"/>
                <col><naming val="title"/><typing val="string"/></col>
            </object>
            """.trimIndent()
        )
        val decl = declaration(actUponObject = "photos.xml")
        val fakeAction = mock(Action::class.java)
        `when`(actionFactory.resolve("LIST")).thenReturn(fakeAction)
        `when`(fakeAction.execute(eq("photos"), any(), any(), any()))
            .thenReturn(listOf(mapOf("title" to "sunset.png")))

        val result = service.invokeFunctionOfModule("photos", mapOf("title" to "sunset.png"), decl, listOf(mapOf("type" to "LIST")))

        assertEquals(true, result["success"])
        @Suppress("UNCHECKED_CAST")
        val data = result["data"] as Map<String, Any?>
        assertEquals(listOf(mapOf("title" to "sunset.png")), data["LIST"])
    }

    @Test
    fun `invokeFunctionOfModule surfaces an ApiException raised by the resolved action`() {
        val moduleDir = File(scanRoot, "photos").apply { mkdirs() }
        File(moduleDir, "photos.xml").writeText("<object><naming val=\"photos\"/></object>")
        val decl = declaration(actUponObject = "photos.xml")
        val fakeAction = mock(Action::class.java)
        `when`(actionFactory.resolve("LIST")).thenReturn(fakeAction)
        `when`(
            fakeAction.execute(any(), any(), any(), any())
        ).thenThrow(com.homelab.core.exception.NotFoundException("object missing"))

        val result = service.invokeFunctionOfModule("photos", emptyMap(), decl, listOf(mapOf("type" to "LIST")))

        @Suppress("UNCHECKED_CAST")
        val data = result["data"] as Map<String, Any?>
        @Suppress("UNCHECKED_CAST")
        val actionResult = data["LIST"] as Map<String, Any?>
        assertEquals("object missing", actionResult["error"])
        assertEquals("NOT_FOUND", actionResult["errorCode"])
    }
}
