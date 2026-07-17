package com.homelab.sdk.helper

import com.homelab.sdk.module.action.ModuleActionDeclaration
import com.homelab.sdk.module.action.ModuleActionLogic
import com.homelab.sdk.module.action.ModuleActionParameter
import com.homelab.sdk.module.action.ModuleActionParameterType
import org.junit.jupiter.api.Assertions.assertEquals
import org.junit.jupiter.api.Assertions.assertFalse
import org.junit.jupiter.api.Assertions.assertNull
import org.junit.jupiter.api.Assertions.assertTrue
import org.junit.jupiter.api.Test

class FilterHelpersTest {

    private fun declaration(parameters: List<ModuleActionParameter>) = ModuleActionDeclaration(
        name = "test-action",
        description = "",
        parameters = parameters,
        logic = listOf(ModuleActionLogic(type = "NOOP")),
        actUponObject = "table"
    )

    @Test
    fun `buildFilters falls back to id when no parameters are declared`() {
        val filters = FilterHelpers.buildFilters(mapOf("id" to "abc"), declaration(emptyList()))

        assertEquals(1, filters.size)
        assertEquals("abc" to ModuleActionParameterType.EQUAL, filters["id"])
    }

    @Test
    fun `buildFilters returns empty map when no parameters declared and no id present`() {
        val filters = FilterHelpers.buildFilters(mapOf("other" to "value"), declaration(emptyList()))

        assertTrue(filters.isEmpty())
    }

    @Test
    fun `buildFilters matches declared parameter using camelCase snake_case or lowercase variants`() {
        val params = listOf(
            ModuleActionParameter(name = "userId", type = ModuleActionParameterType.EQUAL)
        )
        val filters = FilterHelpers.buildFilters(mapOf("user_id" to 42), declaration(params))

        assertEquals(42 to ModuleActionParameterType.EQUAL, filters["user_id"])
    }

    @Test
    fun `buildFilters skips parameters typed NONE`() {
        val params = listOf(
            ModuleActionParameter(name = "comment", type = ModuleActionParameterType.NONE)
        )
        val filters = FilterHelpers.buildFilters(mapOf("comment" to "hello"), declaration(params))

        assertTrue(filters.isEmpty())
    }

    @Test
    fun `buildFilters ignores declared parameters missing from merged params`() {
        val params = listOf(
            ModuleActionParameter(name = "missing", type = ModuleActionParameterType.EQUAL)
        )
        val filters = FilterHelpers.buildFilters(mapOf("other" to "value"), declaration(params))

        assertTrue(filters.isEmpty())
    }

    @Test
    fun `addFilter stores value under snake_case key for camelCase names`() {
        val filters = mutableMapOf<String, Pair<Any?, ModuleActionParameterType>>()

        FilterHelpers.addFilter(filters, "userId" to ModuleActionParameterType.EQUAL, "u1")

        assertEquals("u1" to ModuleActionParameterType.EQUAL, filters["user_id"])
        assertNull(filters["userId"])
    }

    @Test
    fun `addFilter ignores null values`() {
        val filters = mutableMapOf<String, Pair<Any?, ModuleActionParameterType>>()

        FilterHelpers.addFilter(filters, "id" to ModuleActionParameterType.EQUAL, null)

        assertTrue(filters.isEmpty())
    }

    @Test
    fun `addFilter does not overwrite an already present key`() {
        val filters = mutableMapOf<String, Pair<Any?, ModuleActionParameterType>>(
            "id" to ("existing" to ModuleActionParameterType.EQUAL)
        )

        FilterHelpers.addFilter(filters, "id" to ModuleActionParameterType.EQUAL, "new")

        assertEquals("existing" to ModuleActionParameterType.EQUAL, filters["id"])
    }

    @Test
    fun `addFilter mirrors fileName aliases into file_name`() {
        val filters = mutableMapOf<String, Pair<Any?, ModuleActionParameterType>>()

        FilterHelpers.addFilter(filters, "fileName" to ModuleActionParameterType.EQUAL, "photo.png")

        assertEquals("photo.png" to ModuleActionParameterType.EQUAL, filters["file_name"])
        assertFalse(filters.containsKey("fileName"))
    }

    @Test
    fun `addFilter mirrors filePath alias into file`() {
        val filters = mutableMapOf<String, Pair<Any?, ModuleActionParameterType>>()

        FilterHelpers.addFilter(filters, "filePath" to ModuleActionParameterType.EQUAL, "/tmp/a.png")

        assertEquals("/tmp/a.png" to ModuleActionParameterType.EQUAL, filters["file"])
    }
}
