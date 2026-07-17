package com.homelab.core.model.action

import com.homelab.sdk.data.GenericTableLayer
import com.homelab.sdk.module.action.ModuleActionParameterType
import org.junit.jupiter.api.Assertions.assertEquals
import org.junit.jupiter.api.Test
import org.mockito.Mockito.mock
import org.mockito.Mockito.`when`

class ReadActionTest {

    @Test
    fun `execute strips sensitive file fields from every returned row`() {
        val genericObject = mock(GenericTableLayer::class.java)
        val expectedFilters = mapOf("id" to ("42" to ModuleActionParameterType.EQUAL))
        `when`(genericObject.find(expectedFilters)).thenReturn(
            listOf(
                mapOf(
                    "id" to "42",
                    "label" to "hello",
                    "file" to "/secret/path",
                    "filePath" to "/secret/path2",
                    "file_path" to "/secret/path3"
                )
            )
        )

        val result = ReadAction().execute("module-1", mapOf("id" to "42"), genericObject, testDeclaration())

        @Suppress("UNCHECKED_CAST")
        val rows = (result as Map<String, Any?>)["rows"] as List<Map<String, Any?>>
        assertEquals(1, rows.size)
        val row = rows.first()
        assertEquals("42", row["id"])
        assertEquals("hello", row["label"])
        // ReadAction strips file, filePath and file_path from every row
        assertEquals(false, row.containsKey("file"))
        assertEquals(false, row.containsKey("filePath"))
        assertEquals(false, row.containsKey("file_path"))
    }

    @Test
    fun `execute returns an empty rows list when nothing matches`() {
        val genericObject = mock(GenericTableLayer::class.java)
        val expectedFilters = mapOf("id" to ("missing" to ModuleActionParameterType.EQUAL))
        `when`(genericObject.find(expectedFilters)).thenReturn(emptyList())

        val result = ReadAction().execute("module-1", mapOf("id" to "missing"), genericObject, testDeclaration())

        assertEquals(mapOf("rows" to emptyList<Any>()), result)
    }
}
