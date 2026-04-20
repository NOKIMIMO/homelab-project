package com.snk.HomeStock.config

import org.springframework.context.annotation.Configuration
import org.springframework.web.servlet.config.annotation.CorsRegistry
import org.springframework.web.servlet.config.annotation.ResourceHandlerRegistry
import org.springframework.web.servlet.config.annotation.WebMvcConfigurer
import java.nio.file.Path

@Configuration
class WebConfig(private val storageProperties: StorageProperties) : WebMvcConfigurer {

    override fun addResourceHandlers(registry: ResourceHandlerRegistry) {
        val absoluteStorage = Path.of(storageProperties.storageDir).toAbsolutePath().normalize().toString()
        registry.addResourceHandler("/storage/**")
            .addResourceLocations("file:$absoluteStorage/")
    }

    override fun addCorsMappings(registry: CorsRegistry) {
        val origins = storageProperties.corsAllowedOrigins
            .split(",")
            .map { it.trim() }
            .filter { it.isNotEmpty() }
            .toTypedArray()

        registry.addMapping("/api/**")
            .allowedOrigins(*origins)
            .allowedMethods("GET", "POST", "PUT", "DELETE", "OPTIONS")
            .allowCredentials(true)
    }
}
