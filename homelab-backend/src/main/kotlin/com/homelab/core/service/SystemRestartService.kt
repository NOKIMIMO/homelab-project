package com.homelab.core.service

import com.homelab.core.exception.BadRequestException
import com.homelab.sdk.helper.AppLogger
import java.net.StandardProtocolFamily
import java.net.UnixDomainSocketAddress
import java.nio.ByteBuffer
import java.nio.channels.SocketChannel
import java.nio.charset.StandardCharsets
import java.nio.file.Files
import java.nio.file.Path
import org.springframework.stereotype.Service

/**
 * Restarts the running container from the inside, via the Docker Engine API exposed on the
 * bind-mounted /var/run/docker.sock. Docker restarts the container in place with whatever
 * environment it was created with - env vars interpolated by docker-compose at container
 * creation (e.g. JAVA_TOOL_OPTIONS from a freshly-written JAVA_XMX_GB, see
 * [ResourceLimitsService]) are NOT re-read by a restart, only by a full recreate
 * (`docker compose up -d`). This only covers config that just needs a plain JVM restart.
 */
@Service
class SystemRestartService {
    private val log = AppLogger.loggerFor(SystemRestartService::class)
    private val dockerSocket = Path.of("/var/run/docker.sock")

    fun isAvailable(): Boolean = Files.exists(dockerSocket)

    /**
     * Validates synchronously (so the caller gets an immediate, clear error), then fires the
     * actual Docker call on a detached thread after a short delay - the container goes down as
     * part of the restart, so the HTTP response to this call must already be flushed back to the
     * caller first.
     */
    fun restart() {
        if (!isAvailable()) {
            throw BadRequestException(
                "Redémarrage indisponible : le socket Docker n'est pas monté sur ce déploiement."
            )
        }
        val containerId = System.getenv("HOSTNAME")
        if (containerId.isNullOrBlank()) {
            throw BadRequestException("Redémarrage indisponible : identifiant du conteneur introuvable.")
        }

        log.info("Redémarrage du conteneur demandé (id=$containerId)")
        Thread {
            try {
                Thread.sleep(500)
                sendRestartRequest(containerId)
            } catch (e: Exception) {
                log.warn("Échec de l'appel de redémarrage Docker: ${e.message}")
            }
        }.apply {
            isDaemon = true
            name = "docker-restart"
        }.start()
    }

    private fun sendRestartRequest(containerId: String) {
        SocketChannel.open(StandardProtocolFamily.UNIX).use { channel ->
            channel.connect(UnixDomainSocketAddress.of(dockerSocket))
            val request = "POST /containers/$containerId/restart HTTP/1.1\r\n" +
                "Host: localhost\r\n" +
                "Content-Length: 0\r\n" +
                "Connection: close\r\n\r\n"
            channel.write(ByteBuffer.wrap(request.toByteArray(StandardCharsets.US_ASCII)))

            // Docker traite la requête de façon asynchrone cote serveur : fermer le socket tout de
            // suite apres le write() peut couper la connexion (RST) avant que le daemon ait fini de
            // la lire, et le restart n'a jamais lieu. On attend donc la reponse (ou la fermeture par
            // le daemon) avant de fermer notre cote.
            val buffer = ByteBuffer.allocate(4096)
            val response = StringBuilder()
            while (channel.read(buffer) != -1) {
                buffer.flip()
                response.append(StandardCharsets.US_ASCII.decode(buffer))
                buffer.clear()
            }
            log.info("Réponse Docker au redémarrage: ${response.lineSequence().firstOrNull()}")
        }
    }
}
