package com.snk.HomeStock.service

import com.drew.imaging.ImageMetadataReader
import com.drew.metadata.Metadata
import com.drew.metadata.exif.ExifSubIFDDirectory
import com.fasterxml.jackson.databind.JsonNode
import com.fasterxml.jackson.databind.ObjectMapper
import com.snk.HomeStock.config.StorageProperties
import com.snk.HomeStock.domain.Asset
import com.snk.HomeStock.dto.PhotoDto
import com.snk.HomeStock.dto.PhotoMetadataDto
import com.snk.HomeStock.repository.AssetRepository
import jakarta.annotation.PostConstruct
import jakarta.transaction.Transactional
import org.springframework.stereotype.Service
import org.springframework.web.multipart.MultipartFile
import java.nio.file.Files
import java.nio.file.Path
import java.nio.file.StandardCopyOption
import java.nio.file.attribute.FileTime
import java.time.Instant
import java.time.OffsetDateTime
import java.time.ZoneOffset

@Service
class PhotoService(
    private val assetRepository: AssetRepository,
    private val objectMapper: ObjectMapper,
    private val storageProperties: StorageProperties,
    private val syncService: SyncService
) {
    private lateinit var storageDir: Path
    private lateinit var tempDir: Path

    @PostConstruct
    fun init() {
        storageDir = Path.of(storageProperties.storageDir).toAbsolutePath().normalize()
        tempDir = storageDir.resolve(".temp")
        Files.createDirectories(storageDir)
        Files.createDirectories(tempDir)
    }

    fun listPhotos(baseUrl: String): List<PhotoDto> {
        val files = Files.list(storageDir)
            .use { stream ->
                stream
                    .filter { Files.isRegularFile(it) }
                    .filter { isImage(it.fileName.toString()) }
                    .toList()
            }

        files.forEach { filePath ->
            val filename = filePath.fileName.toString()
            val existing = assetRepository.findByName(filename)
            if (existing == null) {
                val extracted = extractPhotoData(filePath)
                assetRepository.save(
                    Asset(
                        name = filename,
                        metadata = extracted.metadata,
                        datePhoto = extracted.photoDate,
                        dateUpload = extracted.uploadDate,
                        origin = "local-scan"
                    )
                )
            }
        }

        val names = files.map { it.fileName.toString() }
        val assets = if (names.isEmpty()) emptyList() else assetRepository.findAllByNameIn(names)

        return assets.map { asset ->
            val metadataMap = objectMapper.convertValue(asset.metadata ?: objectMapper.createObjectNode(), Map::class.java) as Map<String, Any?>
            PhotoDto(
                name = asset.name,
                url = "$baseUrl/storage/${asset.name}",
                date = (asset.datePhoto ?: asset.dateUpload).toInstant().toEpochMilli(),
                uploadDate = asset.dateUpload.toInstant().toEpochMilli(),
                metadata = PhotoMetadataDto(
                    stats = (metadataMap["stats"] as? Map<String, Any?>) ?: emptyMap(),
                    exif = metadataMap["exif"] as? Map<String, Any?>,
                    error = metadataMap["error"] as? String
                )
            )
        }
    }

    @Transactional
    fun uploadSingle(file: MultipartFile, lastModified: Long?, baseUrl: String): Map<String, Any> {
        val sanitized = sanitize(file.originalFilename ?: "upload.bin")
        val tempFile = tempDir.resolve("${System.currentTimeMillis()}-$sanitized")
        val finalFile = storageDir.resolve(sanitized)

        file.inputStream.use { input ->
            Files.copy(input, tempFile, StandardCopyOption.REPLACE_EXISTING)
        }

        if (lastModified != null && lastModified > 0) {
            Files.setLastModifiedTime(tempFile, FileTime.fromMillis(lastModified))
        }

        var skipped = false
        val existing = Files.exists(finalFile)
        if (existing) {
            val tempSize = Files.size(tempFile)
            val finalSize = Files.size(finalFile)
            if (tempSize == finalSize) {
                skipped = true
            }
        }

        if (!skipped) {
            Files.copy(tempFile, finalFile, StandardCopyOption.REPLACE_EXISTING)
            val extracted = extractPhotoData(finalFile)
            val current = assetRepository.findByName(sanitized)
            val toSave = current?.apply {
                metadata = extracted.metadata
                datePhoto = extracted.photoDate
                dateUpload = extracted.uploadDate
                origin = "local-upload"
            } ?: Asset(
                name = sanitized,
                metadata = extracted.metadata,
                datePhoto = extracted.photoDate,
                dateUpload = extracted.uploadDate,
                origin = "local-upload"
            )
            assetRepository.save(toSave)
            syncService.recordSyncCheckpoint()
        }

        Files.deleteIfExists(tempFile)

        return mapOf(
            "success" to true,
            "file" to sanitized,
            "url" to "$baseUrl/storage/$sanitized",
            "skipped" to skipped
        )
    }

    @Transactional
    fun uploadBatch(files: List<MultipartFile>, baseUrl: String): Map<String, Any> {
        val uploaded = mutableListOf<String>()
        var anyChanges = false

        files.forEach { file ->
            val sanitized = sanitize(file.originalFilename ?: "upload.bin")
            val tempFile = tempDir.resolve("${System.currentTimeMillis()}-$sanitized")
            val finalFile = storageDir.resolve(sanitized)

            file.inputStream.use { input ->
                Files.copy(input, tempFile, StandardCopyOption.REPLACE_EXISTING)
            }

            val duplicate = Files.exists(finalFile) && Files.size(finalFile) == Files.size(tempFile)
            if (!duplicate) {
                Files.copy(tempFile, finalFile, StandardCopyOption.REPLACE_EXISTING)
                val extracted = extractPhotoData(finalFile)
                val current = assetRepository.findByName(sanitized)
                val toSave = current?.apply {
                    metadata = extracted.metadata
                    datePhoto = extracted.photoDate
                    dateUpload = extracted.uploadDate
                    origin = "local-batch-upload"
                } ?: Asset(
                    name = sanitized,
                    metadata = extracted.metadata,
                    datePhoto = extracted.photoDate,
                    dateUpload = extracted.uploadDate,
                    origin = "local-batch-upload"
                )
                assetRepository.save(toSave)
                anyChanges = true
            }

            Files.deleteIfExists(tempFile)
            uploaded.add(sanitized)
        }

        if (anyChanges) {
            syncService.recordSyncCheckpoint()
        }

        return mapOf(
            "success" to true,
            "files" to uploaded,
            "urls" to uploaded.map { "$baseUrl/storage/$it" }
        )
    }

    @Transactional
    fun deletePhoto(filename: String): Boolean {
        val filepath = storageDir.resolve(filename)
        Files.deleteIfExists(filepath)
        val existing = assetRepository.findByName(filename)
        if (existing != null) {
            assetRepository.delete(existing)
            syncService.recordSyncCheckpoint()
        }
        return true
    }

    private fun sanitize(input: String): String = input.replace(Regex("[^a-zA-Z0-9.]"), "_")

    private fun isImage(filename: String): Boolean {
        val lower = filename.lowercase()
        return lower.endsWith(".jpg") || lower.endsWith(".jpeg") || lower.endsWith(".png") || lower.endsWith(".gif") || lower.endsWith(".webp") || lower.endsWith(".mp4")
    }

    private fun extractPhotoData(file: Path): ExtractedPhoto {
        val attrs = Files.readAttributes(file, java.nio.file.attribute.BasicFileAttributes::class.java)
        val ctime = attrs.creationTime().toMillis()
        val mtime = attrs.lastModifiedTime().toMillis()
        val candidates = listOf(ctime, mtime).filter { it > 0 }
        var oldest = (candidates.minOrNull() ?: System.currentTimeMillis())

        val stats = mutableMapOf<String, Any?>(
            "size" to attrs.size(),
            "birthtimeMs" to ctime,
            "mtimeMs" to mtime,
            "ctimeMs" to ctime
        )

        val metadataNode = objectMapper.createObjectNode()
        metadataNode.set<JsonNode>("stats", objectMapper.valueToTree(stats))

        try {
            val metadata: Metadata = ImageMetadataReader.readMetadata(file.toFile())
            val exifDir = metadata.getFirstDirectoryOfType(ExifSubIFDDirectory::class.java)
            val exif = mutableMapOf<String, Any?>()

            val dateOriginal = exifDir?.getDateOriginal()
            if (dateOriginal != null) {
                val exifMs = dateOriginal.toInstant().toEpochMilli()
                oldest = minOf(oldest, exifMs)
                exif["DateTimeOriginal"] = exifMs / 1000
            }
            exifDir?.getString(ExifSubIFDDirectory.TAG_MAKE)?.let { exif["Make"] = it }
            exifDir?.getString(ExifSubIFDDirectory.TAG_MODEL)?.let { exif["Model"] = it }
            exifDir?.getRational(ExifSubIFDDirectory.TAG_EXPOSURE_TIME)?.toSimpleString(true)?.let { exif["ExposureTime"] = it }
            exifDir?.getDoubleObject(ExifSubIFDDirectory.TAG_FNUMBER)?.let { exif["FNumber"] = it }
            exifDir?.getInteger(ExifSubIFDDirectory.TAG_ISO_EQUIVALENT)?.let { exif["ISO"] = it }
            exifDir?.getDoubleObject(ExifSubIFDDirectory.TAG_FOCAL_LENGTH)?.let { exif["FocalLength"] = it }

            if (exif.isNotEmpty()) {
                metadataNode.set<JsonNode>("exif", objectMapper.valueToTree(exif))
            }
        } catch (ex: Exception) {
            metadataNode.put("error", ex.message ?: "Exif extraction failed")
        }

        val photoDate = OffsetDateTime.ofInstant(Instant.ofEpochMilli(oldest), ZoneOffset.UTC)
        val uploadDate = OffsetDateTime.ofInstant(Instant.ofEpochMilli(ctime.takeIf { it > 0 } ?: mtime), ZoneOffset.UTC)

        return ExtractedPhoto(
            photoDate = photoDate,
            uploadDate = uploadDate,
            metadata = metadataNode
        )
    }

    data class ExtractedPhoto(
        val photoDate: OffsetDateTime,
        val uploadDate: OffsetDateTime,
        val metadata: JsonNode
    )
}
