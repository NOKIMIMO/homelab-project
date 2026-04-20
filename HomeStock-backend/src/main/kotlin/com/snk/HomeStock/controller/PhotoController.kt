package com.snk.HomeStock.controller

import com.snk.HomeStock.service.PhotoService
import org.springframework.http.HttpStatus
import org.springframework.http.ResponseEntity
import org.springframework.web.bind.annotation.DeleteMapping
import org.springframework.web.bind.annotation.GetMapping
import org.springframework.web.bind.annotation.PathVariable
import org.springframework.web.bind.annotation.PostMapping
import org.springframework.web.bind.annotation.RequestMapping
import org.springframework.web.bind.annotation.RequestParam
import org.springframework.web.bind.annotation.RestController
import org.springframework.web.multipart.MultipartFile
import org.springframework.web.server.ResponseStatusException
import org.springframework.web.servlet.support.ServletUriComponentsBuilder

@RestController
@RequestMapping("/api/photos")
class PhotoController(private val photoService: PhotoService) {

    @GetMapping
    fun listPhotos(): ResponseEntity<Any> {
        return try {
            val baseUrl = ServletUriComponentsBuilder.fromCurrentContextPath().build().toUriString()
            ResponseEntity.ok(photoService.listPhotos(baseUrl))
        } catch (ex: Exception) {
            ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(mapOf("error" to "Err"))
        }
    }

    @PostMapping
    fun uploadSingle(
        @RequestParam("photo") photo: MultipartFile?,
        @RequestParam("lastModified", required = false) lastModified: Long?
    ): ResponseEntity<Any> {
        if (photo == null || photo.isEmpty) {
            throw ResponseStatusException(HttpStatus.BAD_REQUEST, "NoFile")
        }

        return try {
            val baseUrl = ServletUriComponentsBuilder.fromCurrentContextPath().build().toUriString()
            ResponseEntity.ok(photoService.uploadSingle(photo, lastModified, baseUrl))
        } catch (ex: Exception) {
            ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                .body(mapOf("error" to "UploadFailed", "details" to (ex.message ?: "unknown")))
        }
    }

    @PostMapping("/batch")
    fun uploadBatch(@RequestParam("photos") photos: List<MultipartFile>?): ResponseEntity<Any> {
        if (photos.isNullOrEmpty()) {
            throw ResponseStatusException(HttpStatus.BAD_REQUEST, "NoFiles")
        }

        return try {
            val baseUrl = ServletUriComponentsBuilder.fromCurrentContextPath().build().toUriString()
            ResponseEntity.ok(photoService.uploadBatch(photos, baseUrl))
        } catch (ex: Exception) {
            ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                .body(mapOf("error" to "BatchUploadFailed", "details" to (ex.message ?: "unknown")))
        }
    }

    @DeleteMapping("/{filename}")
    fun delete(@PathVariable filename: String): ResponseEntity<Any> {
        return try {
            photoService.deletePhoto(filename)
            ResponseEntity.ok(mapOf("success" to true))
        } catch (ex: Exception) {
            ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(mapOf("error" to "Err"))
        }
    }
}
