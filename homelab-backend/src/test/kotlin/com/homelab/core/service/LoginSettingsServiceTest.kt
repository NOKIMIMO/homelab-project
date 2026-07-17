package com.homelab.core.service

import com.homelab.core.config.HomelabConfig
import com.homelab.core.exception.BadRequestException
import com.homelab.core.model.auth.LoginSettings
import com.homelab.core.model.auth.LoginSettingsRepository
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
import java.io.ByteArrayInputStream
import java.nio.file.Files

class LoginSettingsServiceTest {

    private lateinit var repository: LoginSettingsRepository
    private lateinit var resourceLimitsService: ResourceLimitsService
    private lateinit var homelabConfig: HomelabConfig
    private lateinit var service: LoginSettingsService

    private var savedSettings: LoginSettings? = null

    @BeforeEach
    fun setUp() {
        savedSettings = null
        repository = mock(LoginSettingsRepository::class.java)
        resourceLimitsService = mock(ResourceLimitsService::class.java)
        homelabConfig = HomelabConfig(mock(Environment::class.java))
        homelabConfig.storagePath = Files.createTempDirectory("login-settings-test").toString()
        `when`(repository.findAll()).thenAnswer {
            val current = savedSettings
            val list: List<LoginSettings> = if (current != null) listOf(current) else emptyList()
            list
        }
        `when`(repository.save(org.mockito.ArgumentMatchers.any(LoginSettings::class.java)))
            .thenAnswer { invocation ->
                val entity = invocation.arguments[0] as LoginSettings
                savedSettings = entity
                entity
            }
        service = LoginSettingsService(repository, resourceLimitsService, homelabConfig)
    }

    private fun imageFile(name: String, contentType: String, sizeBytes: Long): MultipartFile {
        val file = mock(MultipartFile::class.java)
        `when`(file.isEmpty).thenReturn(false)
        `when`(file.contentType).thenReturn(contentType)
        `when`(file.size).thenReturn(sizeBytes)
        `when`(file.originalFilename).thenReturn(name)
        `when`(file.inputStream).thenReturn(ByteArrayInputStream(ByteArray(sizeBytes.toInt())))
        return file
    }

    @Test
    fun `getDescription and getAppName default to null when nothing was saved`() {
        assertNull(service.getDescription())
        assertNull(service.getAppName())
    }

    @Test
    fun `setDescription persists and returns the new description`() {
        val result = service.setDescription("My homelab")

        assertEquals("My homelab", result)
    }

    @Test
    fun `hasAppIcon is false when no icon file name is stored`() {
        assertFalse(service.hasAppIcon())
        assertNull(service.getAppIconFile())
    }

    @Test
    fun `setAppIcon rejects an empty file`() {
        val file = mock(MultipartFile::class.java)
        `when`(file.isEmpty).thenReturn(true)

        assertThrows(BadRequestException::class.java) { service.setAppIcon(file) }
    }

    @Test
    fun `setAppIcon rejects a non-image content type`() {
        val file = imageFile("doc.pdf", "application/pdf", 100)

        assertThrows(BadRequestException::class.java) { service.setAppIcon(file) }
    }

    @Test
    fun `setAppIcon rejects a file larger than the 2MB cap`() {
        val file = imageFile("big.png", "image/png", 3L * 1024 * 1024)

        assertThrows(BadRequestException::class.java) { service.setAppIcon(file) }
    }

    @Test
    fun `setAppIcon stores the file and makes it retrievable via getAppIconFile`() {
        val file = imageFile("icon.png", "image/png", 10)

        service.setAppIcon(file)

        val stored = service.getAppIconFile()
        assertTrue(service.hasAppIcon())
        assertTrue(stored != null && stored.exists())
        assertTrue(stored!!.name.startsWith("icon-") && stored.name.endsWith(".png"))
    }

    @Test
    fun `clearAppIcon removes the stored file so hasAppIcon becomes false again`() {
        val file = imageFile("icon.png", "image/png", 10)
        service.setAppIcon(file)
        assertTrue(service.hasAppIcon())

        service.clearAppIcon()

        assertFalse(service.hasAppIcon())
    }
}
