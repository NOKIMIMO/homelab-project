package com.moodboard.controller

import com.moodboard.dto.UserDto
import org.springframework.web.bind.annotation.*
import org.springframework.http.ResponseEntity
import org.springframework.http.HttpStatus
import com.moodboard.service.UserService

@RestController
@RequestMapping("/api/users")
class UserController(
    private val userService: UserService
) {

    @GetMapping
    fun getAllUsers(): ResponseEntity<List<UserDto>> {
        val users = userService.findAll()
        return ResponseEntity.ok(users)
    }

    @GetMapping("/{id}")
    fun getUserById(@PathVariable id: Long): ResponseEntity<UserDto> {
        val user = userService.findById(id)
        return ResponseEntity.ok(user)
    }

    @PostMapping
    fun createUser(@RequestBody userDto: UserDto): ResponseEntity<UserDto> {
        val createdUser = userService.create(userDto)
        return ResponseEntity.status(HttpStatus.CREATED).body(createdUser)
    }

    @PutMapping("/{id}")
    fun updateUser(@PathVariable id: Long, @RequestBody userDto: UserDto): ResponseEntity<UserDto> {
        val updatedUser = userService.update(id, userDto)
        return ResponseEntity.ok(updatedUser)
    }

    @DeleteMapping("/{id}")
    fun deleteUser(@PathVariable id: Long): ResponseEntity<Void> {
        userService.delete(id)
        return ResponseEntity.noContent().build()
    }
}