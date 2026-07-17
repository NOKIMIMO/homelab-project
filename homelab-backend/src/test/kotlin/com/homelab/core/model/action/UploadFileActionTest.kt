package com.homelab.core.model.action

import com.homelab.core.config.HomelabConfig
import com.homelab.core.exception.BadRequestException
import com.homelab.core.exception.NotFoundException
import com.homelab.core.service.ResourceLimitsService
import com.homelab.sdk.data.GenericTableLayer
import org.junit.jupiter.api.Assertions.assertEquals
import org.junit.jupiter.api.Assertions.assertTrue
import org.junit.jupiter.api.BeforeEach
import org.junit.jupiter.api.Test
import org.mockito.Mockito.mock
import org.mockito.Mockito.`when`
import org.mockito.Mockito.doThrow
import org.mockito.kotlin.any
import org.springframework.core.env.Environment
import org.springframework.web.multipart.MultipartFile
import java.io.ByteArrayInputStream
import java.nio.file.Files
import java.nio.file.Path

class UploadFileActionTest {

    private lateinit var resourceLimitsService: ResourceLimitsService
    private lateinit var homelabConfig: HomelabConfig
    private lateinit var storageDir: Path

    @BeforeEach
    fun setUp() {
        resourceLimitsService = mock(ResourceLimitsService::class.java)
        storageDir = Files.createTempDirectory("upload-file-action-test")
        homelabConfig = HomelabConfig(mock(Environment::class.java))
        homelabConfig.storagePath = storageDir.toString()
    }

    private fun multipartFile(name: String, content: String): MultipartFile {
        val file = mock(MultipartFile::class.java)
        `when`(file.originalFilename).thenReturn(name)
        `when`(file.size).thenReturn(content.length.toLong())
        `when`(file.inputStream).thenReturn(ByteArrayInputStream(content.toByteArray()))
        return file
    }

    @Test
    fun `execute returns created false when no MultipartFile is provided`() {
        val genericObject = mock(GenericTableLayer::class.java)

        val result = UploadFileAction(resourceLimitsService, homelabConfig).execute(
            "module-1", mapOf("other" to "value"), genericObject, testDeclaration()
        )

        assertEquals(mapOf("created" to false, "reason" to "no file"), result)
    }

    @Test
    fun `execute rejects the upload when the disk quota is exceeded`() {
        val genericObject = mock(GenericTableLayer::class.java)
        val file = multipartFile("photo.png", "content")
        // read the mock's size up-front: evaluating file.size inside the .checkDiskQuota(...)
        // argument would trigger a mock interaction in the middle of stubbing resourceLimitsService
        val fileSize = file.size
        doThrow(BadRequestException("quota exceeded")).`when`(resourceLimitsService).checkDiskQuota(fileSize)

        val result = UploadFileAction(resourceLimitsService, homelabConfig).execute(
            "module-1", mapOf("file" to file), genericObject, testDeclaration()
        )

        assertEquals(
            mapOf("created" to false, "reason" to "quota_exceeded", "error" to "quota exceeded"),
            result
        )
    }

    @Test
    fun `execute sanitizes the file name strips directories and stores the file under the module`() {
        val genericObject = mock(GenericTableLayer::class.java)
        val file = multipartFile("../weird dir/my photo!@#.png", "hello-bytes")
        `when`(genericObject.create(any())).thenReturn(true)

        val result = UploadFileAction(resourceLimitsService, homelabConfig).execute(
            "module-1", mapOf("file" to file), genericObject, testDeclaration()
        ) as Map<*, *>

        assertEquals(true, result["created"])
        val storedPath = Path.of(result["path"] as String)
        assertTrue(Files.exists(storedPath))
        assertEquals("hello-bytes", Files.readString(storedPath))
        assertTrue(storedPath.startsWith(storageDir.resolve("modules").resolve("module-1")))
        assertTrue(storedPath.fileName.toString().endsWith("_my_photo___.png"))
    }

    @Test
    fun `execute surfaces an ApiException raised while creating the database record`() {
        val genericObject = mock(GenericTableLayer::class.java)
        val file = multipartFile("photo.png", "data")
        `when`(genericObject.create(any())).thenThrow(NotFoundException("object missing"))

        val result = UploadFileAction(resourceLimitsService, homelabConfig).execute(
            "module-1", mapOf("file" to file), genericObject, testDeclaration()
        ) as Map<*, *>

        assertEquals(false, result["created"])
        assertEquals("object missing", result["error"])
        assertEquals("NOT_FOUND", result["errorCode"])
        assertTrue((result["path"] as String).isNotBlank())
    }

    @Test
    fun `execute returns save_failed when reading the uploaded content throws`() {
        val genericObject = mock(GenericTableLayer::class.java)
        val file = mock(MultipartFile::class.java)
        `when`(file.originalFilename).thenReturn("photo.png")
        `when`(file.size).thenReturn(10L)
        `when`(file.inputStream).thenThrow(java.io.IOException("disk error"))

        val result = UploadFileAction(resourceLimitsService, homelabConfig).execute(
            "module-1", mapOf("file" to file), genericObject, testDeclaration()
        )

        assertEquals(mapOf("created" to false, "reason" to "save_failed"), result)
    }
}
