package com.homelab.core.service.module

import com.homelab.core.config.ModuleConfigMemory
import com.homelab.core.model.module.ModuleConfig
import com.homelab.core.model.module.UIFormat
import org.junit.jupiter.api.Assertions.assertEquals
import org.junit.jupiter.api.Assertions.assertFalse
import org.junit.jupiter.api.Assertions.assertTrue
import org.junit.jupiter.api.BeforeEach
import org.junit.jupiter.api.Test
import java.io.File
import java.nio.file.Files

class ModuleParamsServiceTest {

    private lateinit var moduleConfigMemory: ModuleConfigMemory
    private lateinit var moduleDir: File
    private lateinit var service: ModuleParamsService

    private fun dummyConfig(id: String) = ModuleConfig(
        id = id, name = id, version = "1.0", icon = "icon.svg",
        actions = emptyList(), dataObjects = emptyList(), uIFormat = UIFormat.API, page = null, dependencies = emptyList()
    )

    @BeforeEach
    fun setUp() {
        moduleConfigMemory = ModuleConfigMemory()
        moduleDir = Files.createTempDirectory("module-params-test").toFile()
        moduleConfigMemory.put("weather", dummyConfig("weather"), moduleDir)
        service = ModuleParamsService(moduleConfigMemory)
    }

    @Test
    fun `hasParams is false when the module has no params json file`() {
        assertFalse(service.hasParams("weather"))
    }

    @Test
    fun `hasParams is true once a params json file exists`() {
        File(moduleDir, "params.json").writeText("""{"parameters":[]}""")

        assertTrue(service.hasParams("weather"))
    }

    @Test
    fun `getDeclarations returns an empty list for an unknown module`() {
        assertEquals(emptyList<Any>(), service.getDeclarations("does-not-exist"))
    }

    @Test
    fun `getRawValues falls back to declared default values when nothing is stored`() {
        File(moduleDir, "params.json").writeText(
            """{"parameters":[{"key":"units","label":"Units","type":"string","defaultValue":"metric"}]}"""
        )

        assertEquals(mapOf("units" to "metric"), service.getRawValues("weather"))
    }

    @Test
    fun `getRawValues prefers stored values over declared defaults`() {
        File(moduleDir, "params.json").writeText(
            """{"parameters":[{"key":"units","label":"Units","type":"string","defaultValue":"metric"}]}"""
        )
        File(moduleDir, "params.values.json").writeText("""{"units":"imperial"}""")

        assertEquals(mapOf("units" to "imperial"), service.getRawValues("weather"))
    }

    @Test
    fun `getValues masks secret parameters but getRawValues does not`() {
        File(moduleDir, "params.json").writeText(
            """{"parameters":[{"key":"apiKey","label":"API key","type":"secret","defaultValue":""}]}"""
        )
        File(moduleDir, "params.values.json").writeText("""{"apiKey":"super-secret"}""")

        assertEquals(mapOf("apiKey" to "***"), service.getValues("weather"))
        assertEquals(mapOf("apiKey" to "super-secret"), service.getRawValues("weather"))
    }

    @Test
    fun `setValues only persists keys that are declared and merges with existing values`() {
        File(moduleDir, "params.json").writeText(
            """{"parameters":[{"key":"units","label":"Units","type":"string"},{"key":"apiKey","label":"Key","type":"secret"}]}"""
        )
        File(moduleDir, "params.values.json").writeText("""{"units":"metric"}""")

        service.setValues("weather", mapOf("apiKey" to "new-secret", "unrelated" to "ignored"))

        val stored = service.getRawValues("weather")
        assertEquals("metric", stored["units"])
        assertEquals("new-secret", stored["apiKey"])
        assertFalse(File(moduleDir, "params.values.json").readText().contains("unrelated"))
    }
}
