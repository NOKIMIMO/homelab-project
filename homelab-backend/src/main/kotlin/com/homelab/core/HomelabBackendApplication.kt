package com.homelab.core

import org.springframework.boot.autoconfigure.SpringBootApplication
import org.springframework.boot.runApplication
import org.springframework.scheduling.annotation.EnableScheduling
import java.nio.file.Files
import java.nio.file.Paths

@SpringBootApplication
@EnableScheduling
class HomelabBackendApplication

fun main(args: Array<String>) {
	loadDotEnv()

	runApplication<HomelabBackendApplication>(*args)
}

private fun loadDotEnv() {
	try {
		val path = Paths.get(".env").toAbsolutePath().normalize()
		if (!Files.exists(path)) return
		Files.readAllLines(path).forEach { rawLine ->
			val line = rawLine.trim()
			if (line.isEmpty() || line.startsWith("#")) return@forEach
			val idx = line.indexOf('=')
			if (idx <= 0) return@forEach
			val key = line.substring(0, idx).trim()
			var value = line.substring(idx + 1).trim()
			if ((value.startsWith("\"") && value.endsWith("\"")) || (value.startsWith("'") && value.endsWith("'"))) {
				value = value.substring(1, value.length - 1)
			}
			if (System.getProperty(key) == null && System.getenv(key) == null) {
				System.setProperty(key, value)
			}
		}
	} catch (ex: Exception) {
		println("Warning: failed to load .env: ${ex.message}")
	}
}

