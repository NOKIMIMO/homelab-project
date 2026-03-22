package com.homelab.core

import org.springframework.boot.autoconfigure.SpringBootApplication
import org.springframework.boot.runApplication

@SpringBootApplication
class HomelabBackendApplication

fun main(args: Array<String>) {
	runApplication<HomelabBackendApplication>(*args)
}
