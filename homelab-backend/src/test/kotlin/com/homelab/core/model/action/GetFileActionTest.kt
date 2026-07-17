package com.homelab.core.model.action

import com.homelab.sdk.data.GenericTableLayer
import com.homelab.sdk.module.action.ModuleActionParameterType
import org.junit.jupiter.api.Assertions.assertEquals
import org.junit.jupiter.api.Test
import org.mockito.Mockito.mock
import org.mockito.Mockito.`when`
import java.nio.file.Files

class GetFileActionTest {

    @Test
    fun `execute returns success false with nulls when no record matches`() {
        val genericObject = mock(GenericTableLayer::class.java)
        val expectedFilters = mapOf("id" to ("1" to ModuleActionParameterType.EQUAL))
        `when`(genericObject.find(expectedFilters)).thenReturn(emptyList())

        val result = GetFileAction().execute("module-1", mapOf("id" to "1"), genericObject, testDeclaration())

        assertEquals(
            mapOf("success" to false, "filePath" to null, "fileName" to null, "contentType" to null),
            result
        )
    }

    @Test
    fun `execute returns success false when the record has no file column`() {
        val genericObject = mock(GenericTableLayer::class.java)
        val expectedFilters = mapOf("id" to ("1" to ModuleActionParameterType.EQUAL))
        `when`(genericObject.find(expectedFilters)).thenReturn(listOf(mapOf("id" to "1", "label" to "no file here")))

        val result = GetFileAction().execute("module-1", mapOf("id" to "1"), genericObject, testDeclaration())

        assertEquals(
            mapOf("success" to false, "filePath" to null, "fileName" to null, "contentType" to null),
            result
        )
    }

    @Test
    fun `execute returns success false but keeps the path when the physical file is missing`() {
        val genericObject = mock(GenericTableLayer::class.java)
        val expectedFilters = mapOf("id" to ("1" to ModuleActionParameterType.EQUAL))
        `when`(genericObject.find(expectedFilters)).thenReturn(
            listOf(mapOf("id" to "1", "file" to "/does/not/exist.png"))
        )

        val result = GetFileAction().execute("module-1", mapOf("id" to "1"), genericObject, testDeclaration())

        assertEquals(
            mapOf("success" to false, "filePath" to "/does/not/exist.png", "fileName" to "exist.png", "contentType" to null),
            result
        )
    }

    @Test
    fun `execute returns success true with content type when the file exists on disk`() {
        val genericObject = mock(GenericTableLayer::class.java)
        val tempFile = Files.createTempFile("get-file-action-test", ".txt")
        Files.writeString(tempFile, "hello")
        val expectedFilters = mapOf("id" to ("1" to ModuleActionParameterType.EQUAL))
        `when`(genericObject.find(expectedFilters)).thenReturn(
            listOf(mapOf("id" to "1", "file" to tempFile.toString(), "file_name" to "custom-name.txt"))
        )

        val result = GetFileAction().execute("module-1", mapOf("id" to "1"), genericObject, testDeclaration())

        @Suppress("UNCHECKED_CAST")
        val resultMap = result as Map<String, Any?>
        assertEquals(true, resultMap["success"])
        assertEquals(tempFile.toString(), resultMap["filePath"])
        assertEquals("custom-name.txt", resultMap["fileName"])
        // probeContentType is platform-dependent but the action always falls back to a non-null value
        org.junit.jupiter.api.Assertions.assertNotNull(resultMap["contentType"])
    }
}
