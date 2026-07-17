package com.homelab.core.service

import com.homelab.core.exception.BadRequestException
import org.junit.jupiter.api.Assertions.assertFalse
import org.junit.jupiter.api.Assertions.assertThrows
import org.junit.jupiter.api.Test
import java.nio.file.Files
import java.nio.file.Path

class SystemRestartServiceTest {

    private val service = SystemRestartService()

    @Test
    fun `isAvailable is false when the docker socket is not mounted`() {
        // true on any regular dev machine / CI runner that isn't the production container
        if (Files.exists(Path.of("/var/run/docker.sock"))) return
        assertFalse(service.isAvailable())
    }

    @Test
    fun `restart throws when the docker socket is not available`() {
        if (Files.exists(Path.of("/var/run/docker.sock"))) return
        assertThrows(BadRequestException::class.java) { service.restart() }
    }
}
