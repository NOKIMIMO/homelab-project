package com.homelab.core

import org.junit.jupiter.api.BeforeAll
import org.junit.jupiter.api.Test
import org.springframework.boot.test.context.SpringBootTest

@SpringBootTest
class HomelabBackendApplicationTests {

	companion object {
		@JvmStatic
		@BeforeAll
		fun loadEnv() {
			loadDotEnv()
		}
	}

	@Test
	fun contextLoads() {
	}

}
