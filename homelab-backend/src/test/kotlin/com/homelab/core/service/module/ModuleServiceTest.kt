package com.homelab.core.service.module

import com.fasterxml.jackson.databind.ObjectMapper
import com.homelab.core.action.ActionFactory
import com.homelab.core.config.HomelabConfig
import com.homelab.core.config.ModuleConfigMemory
import com.homelab.core.config.ObjectDefinitionMemory
import com.homelab.core.exception.BadRequestException
import com.homelab.core.model.module.ModuleStatus
import com.homelab.core.plugin.PluginRegistry
import com.homelab.core.service.ResourceLimitsService
import org.junit.jupiter.api.Assertions.assertEquals
import org.junit.jupiter.api.Assertions.assertFalse
import org.junit.jupiter.api.Assertions.assertNull
import org.junit.jupiter.api.Assertions.assertThrows
import org.junit.jupiter.api.Assertions.assertTrue
import org.junit.jupiter.api.BeforeEach
import org.junit.jupiter.api.Test
import org.mockito.Mockito.mock
import org.mockito.Mockito.`when`
import org.springframework.core.env.Environment
import org.springframework.web.multipart.MultipartFile
import java.io.File
import java.nio.file.Files

class ModuleServiceTest {

    private lateinit var moduleDatabaseService: ModuleDatabaseService
    private lateinit var actionFactory: ActionFactory
    private lateinit var moduleParamsService: ModuleParamsService
    private lateinit var resourceLimitsService: ResourceLimitsService
    private lateinit var homelabConfig: HomelabConfig
    private lateinit var service: ModuleService
    private lateinit var scanRoot: File

    @BeforeEach
    fun setUp() {
        moduleDatabaseService = mock(ModuleDatabaseService::class.java)
        actionFactory = mock(ActionFactory::class.java)
        moduleParamsService = mock(ModuleParamsService::class.java)
        resourceLimitsService = mock(ResourceLimitsService::class.java)
        scanRoot = Files.createTempDirectory("module-service-test").toFile()
        homelabConfig = HomelabConfig(mock(Environment::class.java))
        homelabConfig.modulesScanPath = scanRoot.absolutePath

        service = ModuleService(
            homelabConfig = homelabConfig,
            moduleDatabaseService = moduleDatabaseService,
            moduleConfigService = ModuleConfigService(mock(PluginRegistry::class.java)),
            actionFactory = actionFactory,
            moduleConfigMemory = ModuleConfigMemory(),
            moduleParamsService = moduleParamsService,
            objectMapper = ObjectMapper(),
            objectDefinitionMemory = ObjectDefinitionMemory(),
            resourceLimitsService = resourceLimitsService
        )
    }

    private fun installWeatherModule() {
        val dir = File(scanRoot, "weather").apply { mkdirs() }
        File(dir, "manifest.json").writeText(
            """
            {
                "id": "weather", "name": "Weather", "version": "1.0.0", "icon": "icon.svg",
                "dataObjects": ["weather.xml"],
                "actions": [{"visual": "list.json", "functions": [
                    {"name": "list", "description": "", "parameters": [], "logic": [{"type": "LIST"}], "actUponObject": "weather.xml"}
                ]}],
                "dependencies": null
            }
            """.trimIndent()
        )
        File(dir, "weather.xml").writeText(
            """<object><naming val="weather"/><col><naming val="city"/><typing val="string"/></col></object>"""
        )
        File(dir, "icon.svg").writeText("<svg/>")
    }

    @Test
    fun `getModule returns null before any module has been scanned`() {
        assertNull(service.getModule("weather"))
        assertFalse(service.isModuleRunning("weather"))
    }

    @Test
    fun `scanModules discovers and auto-starts a module`() {
        installWeatherModule()

        service.scanModules()

        val module = service.getModule("weather")
        assertTrue(module != null)
        assertEquals(ModuleStatus.ACTIVE, module!!.status)
        assertTrue(service.isModuleRunning("weather"))
    }

    @Test
    fun `getModules maps hasParams from ModuleParamsService`() {
        installWeatherModule()
        `when`(moduleParamsService.hasParams("weather")).thenReturn(true)

        service.scanModules()

        val dto = service.getModules().first { it.id == "weather" }
        assertTrue(dto.hasParams)
        assertEquals("/api/modules/weather/UI/icon", dto.icon)
    }

    @Test
    fun `stopModule then startModule toggles the module status`() {
        installWeatherModule()
        service.scanModules()

        service.stopModule("weather")
        assertFalse(service.isModuleRunning("weather"))

        service.startModule("weather")
        assertTrue(service.isModuleRunning("weather"))
    }

    @Test
    fun `startModule and stopModule return false for an unknown module`() {
        assertFalse(service.startModule("does-not-exist"))
        assertFalse(service.stopModule("does-not-exist"))
    }

    @Test
    fun `unregisterModule removes the module so it is no longer known`() {
        installWeatherModule()
        service.scanModules()
        assertTrue(service.getModule("weather") != null)

        service.unregisterModule("weather")

        assertNull(service.getModule("weather"))
    }

    @Test
    fun `healthCheck is false for a module that is not running`() {
        installWeatherModule()
        service.scanModules()
        service.stopModule("weather")

        assertFalse(service.healthCheck("weather"))
    }

    @Test
    fun `getAvailableAction delegates to the action factory`() {
        `when`(actionFactory.getAvailableActionTypes()).thenReturn(listOf("LIST", "READ"))

        assertEquals(listOf("LIST", "READ"), service.getAvailableAction())
    }

    @Test
    fun `installModuleZip rejects an empty file`() {
        val file = mock(MultipartFile::class.java)
        `when`(file.isEmpty).thenReturn(true)

        assertThrows(BadRequestException::class.java) { service.installModuleZip(file) }
    }

    @Test
    fun `installModuleZip rejects a non-zip file`() {
        val file = mock(MultipartFile::class.java)
        `when`(file.isEmpty).thenReturn(false)
        `when`(file.originalFilename).thenReturn("module.tar.gz")

        assertThrows(BadRequestException::class.java) { service.installModuleZip(file) }
    }
}
