package com.snk.HomeStock.controller

import com.snk.HomeStock.dto.BoardPayload
import com.snk.HomeStock.service.BoardService
import org.springframework.http.HttpStatus
import org.springframework.http.ResponseEntity
import org.springframework.web.bind.annotation.DeleteMapping
import org.springframework.web.bind.annotation.GetMapping
import org.springframework.web.bind.annotation.PathVariable
import org.springframework.web.bind.annotation.PutMapping
import org.springframework.web.bind.annotation.RequestBody
import org.springframework.web.bind.annotation.RequestMapping
import org.springframework.web.bind.annotation.RestController
import java.util.UUID

@RestController
@RequestMapping("/api/boards")
class BoardController(private val boardService: BoardService) {

    @GetMapping
    fun list(): ResponseEntity<Any> {
        return try {
            ResponseEntity.ok(boardService.listBoards())
        } catch (ex: Exception) {
            ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(mapOf("error" to "Err"))
        }
    }

    @GetMapping("/{id}")
    fun getById(@PathVariable id: UUID): ResponseEntity<Any> {
        return try {
            val board = boardService.getBoard(id)
            if (board == null) {
                ResponseEntity.status(HttpStatus.NOT_FOUND).body(mapOf("error" to "NotFound"))
            } else {
                ResponseEntity.ok(board)
            }
        } catch (ex: Exception) {
            ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(mapOf("error" to "Err"))
        }
    }

    @PutMapping("/{id}")
    fun upsert(@PathVariable id: UUID, @RequestBody payload: BoardPayload): ResponseEntity<Any> {
        return try {
            val savedId = boardService.upsertBoard(id, payload)
            ResponseEntity.ok(mapOf("success" to true, "id" to savedId.toString()))
        } catch (ex: Exception) {
            ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(mapOf("error" to "Err"))
        }
    }

    @DeleteMapping("/{id}")
    fun delete(@PathVariable id: UUID): ResponseEntity<Any> {
        return try {
            val deleted = boardService.deleteBoard(id)
            if (!deleted) {
                ResponseEntity.status(HttpStatus.NOT_FOUND).body(mapOf("error" to "NotFound"))
            } else {
                ResponseEntity.ok(mapOf("success" to true))
            }
        } catch (ex: Exception) {
            ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(mapOf("error" to "Err"))
        }
    }
}
