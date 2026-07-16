package com.homelab.core.service

import com.homelab.core.config.HomelabConfig
import com.homelab.core.exception.BadRequestException
import com.homelab.core.model.auth.LoginSettings
import com.homelab.core.model.auth.LoginSettingsRepository
import com.homelab.sdk.helper.AppLogger
import org.springframework.stereotype.Service
import org.springframework.web.multipart.MultipartFile
import java.io.File
import java.nio.file.Files
import java.nio.file.Path
import java.nio.file.StandardCopyOption
import java.time.LocalDateTime
import java.util.UUID

private val MAX_ICON_BYTES = 2L * 1024 * 1024 // 2 MB

// The owner-configurable description, app name and app icon shown on the login card / browser
// tab. Single active row, publicly readable since the login page itself isn't authenticated.
@Service
class LoginSettingsService(
    private val repository: LoginSettingsRepository,
    private val resourceLimitsService: ResourceLimitsService,
    private val homelabConfig: HomelabConfig,
) {
    private val log = AppLogger.loggerFor(LoginSettingsService::class)
    private val iconStorageDir: Path = Path.of(homelabConfig.storagePath, "branding").toAbsolutePath().normalize()

    private fun current(): LoginSettings = repository.findAll().firstOrNull() ?: LoginSettings()

    fun getDescription(): String? = current().description
    fun getAppName(): String? = current().appName

    fun setDescription(description: String?): String? = save { it.description = description }.description
    fun setAppName(appName: String?): String? = save { it.appName = appName }.appName

    fun hasAppIcon(): Boolean = getAppIconFile() != null

    fun getAppIconFile(): File? {
        val fileName = current().appIcon.takeUnless { it.isNullOrBlank() } ?: return null
        val file = iconStorageDir.resolve(fileName).normalize()
        if (!file.startsWith(iconStorageDir) || !Files.isRegularFile(file)) return null
        return file.toFile()
    }

    fun setAppIcon(file: MultipartFile) {
        if (file.isEmpty) throw BadRequestException("Empty file")
        if (file.contentType?.startsWith("image/") != true) {
            throw BadRequestException("File must be an image")
        }
        if (file.size > MAX_ICON_BYTES) {
            throw BadRequestException("Image too large (max ${MAX_ICON_BYTES / (1024 * 1024)} MB)")
        }
        resourceLimitsService.checkDiskQuota(file.size)

        Files.createDirectories(iconStorageDir)

        val extension = file.originalFilename
            ?.substringAfterLast('.', "")
            ?.lowercase()
            ?.filter { it.isLetterOrDigit() }
            .orEmpty()
        val storedFileName = "icon-${UUID.randomUUID()}" + if (extension.isNotEmpty()) ".$extension" else ""
        val targetPath = iconStorageDir.resolve(storedFileName).normalize()
        if (!targetPath.startsWith(iconStorageDir)) {
            throw BadRequestException("Invalid file name")
        }

        deleteStoredIconFile()
        try {
            file.inputStream.use { input -> Files.copy(input, targetPath, StandardCopyOption.REPLACE_EXISTING) }
        } catch (e: Exception) {
            log.error("Failed to save app icon: ${e.message}", e)
            throw BadRequestException("Failed to save the file")
        }

        save { it.appIcon = storedFileName }
    }

    fun clearAppIcon() {
        deleteStoredIconFile()
        save { it.appIcon = null }
    }

    private fun deleteStoredIconFile() {
        val fileName = current().appIcon ?: return
        val file = iconStorageDir.resolve(fileName).normalize()
        if (file.startsWith(iconStorageDir)) {
            try {
                Files.deleteIfExists(file)
            } catch (e: Exception) {
                log.warn("Failed to delete previous app icon file '$fileName': ${e.message}")
            }
        }
    }

    private fun save(mutate: (LoginSettings) -> Unit): LoginSettings {
        val entity = current()
        mutate(entity)
        entity.updatedAt = LocalDateTime.now()
        return repository.save(entity)
    }
}
