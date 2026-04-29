package com.snk.HomeStock.mapper

import org.springframework.stereotype.Component
import com.snk.HomeStock.repository.model.UserEntity
import com.snk.HomeStock.domain.entity.UserClass
import com.snk.HomeStock.api.dto.UserDto

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