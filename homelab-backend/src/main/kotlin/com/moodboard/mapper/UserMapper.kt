package com.moodboard.mapper

import com.moodboard.dto.UserDto
import com.moodboard.entity.UserEntity
import org.springframework.stereotype.Component

@Component
class UserMapper {

    fun toDto(entity: UserEntity): UserDto {
        return UserDto(
            id = entity.id,
            username = entity.username,
            email = entity.email
        )
    }

    fun toEntity(dto: UserDto): UserEntity {
        return UserEntity(
            id = dto.id,
            username = dto.username,
            email = dto.email,
            password = ""
        )
    }

    fun toDtoList(entities: List<UserEntity>): List<UserDto> {
        return entities.map { toDto(it) }
    }


    fun updateEntityFromDto(entity: UserEntity, dto: UserDto): UserEntity {
        entity.username = dto.username
        entity.email = dto.email
        return entity
    }
}
