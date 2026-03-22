package com.homelab.core

import org.springframework.boot.autoconfigure.SpringBootApplication
import org.springframework.boot.runApplication
import org.springframework.scheduling.annotation.EnableScheduling

@SpringBootApplication
@EnableScheduling
class HomelabBackendApplication

fun main(args: Array<String>) {
	runApplication<HomelabBackendApplication>(*args)
}
