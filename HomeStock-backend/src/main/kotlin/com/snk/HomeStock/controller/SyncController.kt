package com.snk.HomeStock.controller

import com.snk.HomeStock.service.SyncService
import org.springframework.http.HttpStatus
import org.springframework.http.ResponseEntity
import org.springframework.web.bind.annotation.GetMapping
import org.springframework.web.bind.annotation.RequestMapping
import org.springframework.web.bind.annotation.RequestParam
import org.springframework.web.bind.annotation.RestController

@RestController
@RequestMapping("/api/sync")
class SyncController(private val syncService: SyncService) {

    @GetMapping("/health")
    fun health(): ResponseEntity<Any> {
        return ResponseEntity.ok(mapOf("status" to "ok"))
    }

    @GetMapping("/last")
    fun last(): ResponseEntity<Any> {
        return try {
            val latest = syncService.latestSyncDate()
            ResponseEntity.ok(
                mapOf(
                    "lastSync" to latest?.toInstant()?.toEpochMilli(),
                    "lastSyncIso" to latest?.toString()
                )
            )
        } catch (ex: Exception) {
            ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(mapOf("error" to "Err"))
        }
    }

    @GetMapping("/check")
    fun check(@RequestParam("since", required = false) since: Long?): ResponseEntity<Any> {
        return try {
            val latest = syncService.latestSyncDate()
            val latestMs = latest?.toInstant()?.toEpochMilli()
            val changed = since == null || latestMs == null || latestMs != since
            ResponseEntity.ok(
                mapOf(
                    "changed" to changed,
                    "since" to since,
                    "lastSync" to latestMs,
                    "lastSyncIso" to latest?.toString(),
                    "action" to if (changed) "upload_all_photos_and_board" else "noop"
                )
            )
        } catch (ex: Exception) {
            ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(mapOf("error" to "Err"))
        }
    }
}
