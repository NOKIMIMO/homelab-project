package com.homelab.core.service.module

import com.homelab.core.exception.BadRequestException
import com.homelab.core.model.module.ModuleStatus
import com.homelab.core.plugin.PluginRegistry
import org.junit.jupiter.api.Assertions.assertEquals
import org.junit.jupiter.api.Assertions.assertThrows
import org.junit.jupiter.api.Assertions.assertTrue
import org.junit.jupiter.api.BeforeEach
import org.junit.jupiter.api.Test
import org.mockito.Mockito.mock
import org.mockito.Mockito.`when`
import java.io.File
import java.nio.file.Files

class ModuleConfigServiceTest {

    private lateinit var pluginRegistry: PluginRegistry
    private lateinit var service: ModuleConfigService
    private lateinit var scanRoot: File

    @BeforeEach
    fun setUp() {
        pluginRegistry = mock(PluginRegistry::class.java)
        service = ModuleConfigService(pluginRegistry)
        scanRoot = Files.createTempDirectory("module-config-service-test").toFile()
    }

    private fun manifest(
        id: String = "weather",
        logicType: String = "LIST",
        dependencies: String = "null"
    ) = """
        {
            "id": "$id",
            "name": "$id",
            "version": "1.0.0",
            "icon": "icon.svg",
            "dataObjects": [],
            "actions": [
                {
                    "visual": "list.json",
                    "functions": [
                        {
                            "name": "list",
                            "description": "",
                            "parameters": [],
                            "logic": [{"type": "$logicType"}],
                            "actUponObject": "weather.xml"
                        }
                    ]
                }
            ],
            "dependencies": $dependencies
        }
    """.trimIndent()

    private fun moduleDir(name: String, manifestJson: String): File {
        val dir = File(scanRoot, name).apply { mkdirs() }
        File(dir, "manifest.json").writeText(manifestJson)
        return dir
    }

    @Test
    fun `scanModuleConfigs skips directories without a manifest json`() {
        File(scanRoot, "not-a-module").mkdirs()

        val discovered = service.scanModuleConfigs(scanRoot.absolutePath)

        assertTrue(discovered.isEmpty())
    }

    @Test
    fun `scanModuleConfigs discovers a valid module`() {
        moduleDir("weather", manifest())

        val discovered = service.scanModuleConfigs(scanRoot.absolutePath)

        assertEquals(1, discovered.size)
        assertEquals("weather", discovered.first().config.id)
    }

    @Test
    fun `scanModuleConfigs skips a module with a malformed manifest instead of throwing`() {
        moduleDir("broken", "{ not valid json")

        val discovered = service.scanModuleConfigs(scanRoot.absolutePath)

        assertTrue(discovered.isEmpty())
    }

    @Test
    fun `parseAndValidateManifest throws BadRequestException when manifest json is missing`() {
        val dir = File(scanRoot, "empty").apply { mkdirs() }

        assertThrows(BadRequestException::class.java) { service.parseAndValidateManifest(dir, emptySet()) }
    }

    @Test
    fun `parseAndValidateManifest rejects a duplicate module id`() {
        val dir = moduleDir("weather", manifest(id = "weather"))

        assertThrows(BadRequestException::class.java) {
            service.parseAndValidateManifest(dir, setOf("weather"))
        }
    }

    @Test
    fun `parseAndValidateManifest rejects duplicate function names within the module`() {
        val json = """
            {
                "id": "weather",
                "name": "weather",
                "version": "1.0.0",
                "icon": "icon.svg",
                "dataObjects": [],
                "actions": [
                    {"visual": "a.json", "functions": [{"name": "list", "description": "", "parameters": [], "logic": [{"type": "LIST"}], "actUponObject": "weather.xml"}]},
                    {"visual": "b.json", "functions": [{"name": "list", "description": "", "parameters": [], "logic": [{"type": "READ"}], "actUponObject": "weather.xml"}]}
                ],
                "dependencies": null
            }
        """.trimIndent()
        val dir = moduleDir("weather", json)

        assertThrows(BadRequestException::class.java) { service.parseAndValidateManifest(dir, emptySet()) }
    }

    @Test
    fun `parseAndValidateManifest accepts builtin action logic types`() {
        val dir = moduleDir("weather", manifest(logicType = "LIST"))

        val config = service.parseAndValidateManifest(dir, emptySet())

        assertEquals("weather", config.id)
    }

    @Test
    fun `parseAndValidateManifest accepts a logic type registered by a plugin`() {
        `when`(pluginRegistry.hasType("CUSTOM_PLUGIN_ACTION")).thenReturn(true)
        val dir = moduleDir("weather", manifest(logicType = "CUSTOM_PLUGIN_ACTION"))

        val config = service.parseAndValidateManifest(dir, emptySet())

        assertEquals("weather", config.id)
    }

    @Test
    fun `parseAndValidateManifest rejects an unknown non-plugin logic type`() {
        `when`(pluginRegistry.hasType("MADE_UP_TYPE")).thenReturn(false)
        val dir = moduleDir("weather", manifest(logicType = "MADE_UP_TYPE"))

        assertThrows(BadRequestException::class.java) { service.parseAndValidateManifest(dir, emptySet()) }
    }

    @Test
    fun `parseAndValidateManifest rejects an incompatible dependency version requirement`() {
        val dir = moduleDir("weather", manifest(dependencies = """[{"moduleId": "core", "version": "^2.0.0"}]"""))

        assertThrows(BadRequestException::class.java) { service.parseAndValidateManifest(dir, emptySet()) }
    }

    @Test
    fun `parseAndValidateManifest accepts a compatible dependency version requirement`() {
        val dir = moduleDir("weather", manifest(dependencies = """[{"moduleId": "core", "version": "^1.0.0"}]"""))

        val config = service.parseAndValidateManifest(dir, emptySet())

        assertEquals("weather", config.id)
    }

    @Test
    fun `createModuleFromConfig maps config fields into an inactive Module`() {
        val dir = moduleDir("weather", manifest())
        val config = service.parseAndValidateManifest(dir, emptySet())

        val module = service.createModuleFromConfig(config)

        assertEquals("weather", module.id)
        assertEquals(ModuleStatus.INACTIVE, module.status)
        assertEquals("weather", module.internalUrl)
    }
}
