package com.snk.HomeStock.config

import com.fasterxml.jackson.databind.ObjectMapper
import com.fasterxml.jackson.datatype.jsr310.JavaTimeModule
import com.fasterxml.jackson.module.kotlin.KotlinModule
import org.springframework.boot.context.properties.EnableConfigurationProperties
import org.springframework.context.annotation.Bean
import org.springframework.context.annotation.Configuration

@Configuration
@EnableConfigurationProperties(StorageProperties::class)
class AppConfig {

	@Bean
	fun objectMapper(): ObjectMapper =
		ObjectMapper()
			.registerModule(KotlinModule.Builder().build())
			.registerModule(JavaTimeModule())
}
