package com.moodboard.service

import org.springframework.stereotype.Service
import com.moodboard.repository.UserRepository
import com.moodboard.entity.UserEntity
import com.moodboard.dto.UserDto
import com.moodboard.mapper.UserMapper

@Service
class UserService(
    private val repository: UserRepository,
    private val userMapper: UserMapper
) {

    fun findAll(): List<UserDto> = userMapper.toDtoList(repository.findAll())

    fun findById(id: Long): UserDto = repository.findById(id)
        .orElseThrow { NoSuchElementException("User with id $id not found") }
        .let { userMapper.toDto(it) }

    fun create(dto: UserDto): UserDto = repository.save(userMapper.toEntity(dto))
        .let { userMapper.toDto(it) }

    fun update(id: Long, dto: UserDto): UserDto {
        val existing = repository.findById(id)
            .orElseThrow { NoSuchElementException("User with id $id not found") }
        val updated = userMapper.updateEntityFromDto(existing, dto)
        return repository.save(updated).let { userMapper.toDto(it) }
    }

    fun delete(id: Long) {
        if (!repository.existsById(id)) {
            throw NoSuchElementException("User with id $id not found")
        }
        repository.deleteById(id)
    }
}
