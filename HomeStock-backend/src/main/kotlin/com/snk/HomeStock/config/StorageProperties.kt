package com.snk.HomeStock.config

import org.springframework.boot.context.properties.ConfigurationProperties

@ConfigurationProperties(prefix = "app")
data class StorageProperties(
    val storageDir: String = "./public/storage",
    val corsAllowedOrigins: String = "http://localhost:5173,http://127.0.0.1:5173"
)
