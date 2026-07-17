package com.homelab.core.service

import com.homelab.core.api.dto.alert.toDto
import com.homelab.core.model.alert.AlertEvent
import com.homelab.sdk.helper.AppLogger
import java.util.concurrent.CopyOnWriteArrayList
import org.springframework.http.MediaType
import org.springframework.scheduling.annotation.Scheduled
import org.springframework.stereotype.Service
import org.springframework.web.servlet.mvc.method.annotation.SseEmitter

/**
 * Delivers alert notifications to mobile devices over a persistent Server-Sent Events stream.
 *
 * Each device holds one long-lived `GET /api/alerts/stream` connection (kept alive from an Android
 * foreground service). When an alert fires, [broadcast] pushes it down every open stream in real
 * time. Unlike the previous UnifiedPush/ntfy path this needs **no third-party push server**: the
 * phone connects straight to this backend (the same host it already uses for everything else), so
 * privacy is exactly that of the app's normal traffic — use an HTTPS backend to encrypt it.
 *
 * A device that misses events while briefly disconnected catches up on reconnect via
 * `GET /api/alerts/events` (server-time cursor), so the stream only has to carry the live edge.
 */
@Service
class AlertStreamService {
    private val log = AppLogger.loggerFor(AlertStreamService::class)

    /** Open client streams. Copy-on-write so broadcast/heartbeat can iterate without locking. */
    private val emitters = CopyOnWriteArrayList<SseEmitter>()

    /**
     * Opens a new stream for a connecting device. Timeout is disabled (0): liveness is managed by
     * the [heartbeat] (which prunes dead sockets) and the client's own reconnect loop.
     */
    fun subscribe(): SseEmitter {
        val emitter = SseEmitter(0L)
        emitter.onCompletion { emitters.remove(emitter) }
        emitter.onTimeout {
            emitters.remove(emitter)
            emitter.complete()
        }
        emitter.onError { emitters.remove(emitter) }
        emitters.add(emitter)
        // Send a first event right away so response headers flush and the client knows it's live.
        try {
            emitter.send(SseEmitter.event().name("connected").data("ok"))
        } catch (ex: Exception) {
            emitters.remove(emitter)
        }
        return emitter
    }

    /** Pushes [event] to every open stream. Dead sockets are dropped (the device reconnects). */
    fun broadcast(event: AlertEvent) {
        if (emitters.isEmpty()) return
        val dto = event.toDto()
        for (emitter in emitters) {
            try {
                emitter.send(SseEmitter.event().name("alert").data(dto, MediaType.APPLICATION_JSON))
            } catch (ex: Exception) {
                emitters.remove(emitter)
                runCatching { emitter.complete() }
            }
        }
        log.info("Streamed alert '${event.ruleName}' to ${emitters.size} device(s)")
    }

    /**
     * Keeps idle connections warm (some NATs/proxies drop silent TCP) and doubles as dead-connection
     * detection: a send that throws means the client vanished, so we prune it.
     */
    @Scheduled(fixedRate = 25_000)
    fun heartbeat() {
        if (emitters.isEmpty()) return
        for (emitter in emitters) {
            try {
                emitter.send(SseEmitter.event().comment("ping"))
            } catch (ex: Exception) {
                emitters.remove(emitter)
                runCatching { emitter.complete() }
            }
        }
    }
}
