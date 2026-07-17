package com.homelab.core.service

import com.homelab.core.model.alert.AlertEvent
import com.homelab.core.model.alert.AlertEventRepository
import com.homelab.core.model.alert.AlertSeverity
import com.homelab.core.model.alert.AlertSource
import com.homelab.sdk.helper.AppLogger
import jakarta.annotation.PostConstruct
import jakarta.annotation.PreDestroy
import java.util.concurrent.atomic.AtomicLong
import org.springframework.stereotype.Service

/**
 * Turns non-metric server events into mobile notifications, reusing the same [AlertEvent] pipeline
 * (persisted for catch-up, broadcast over SSE) as threshold rules:
 *  - [raiseAccountPending] — a new sign-up is waiting for an admin to validate it.
 *  - server errors — every [AppLogger.error] is caught (via a listener registered at startup) and
 *    **coalesced** into a single "an error occurred" notification: at most one per [ERROR_COOLDOWN_MS]
 *    window, so an error storm can't spam the device or repeat forever.
 *
 * Metric-rule alerts stay in [AlertService]; this service only covers the two extra sources.
 */
@Service
class SystemAlertService(
    private val eventRepository: AlertEventRepository,
    private val alertStreamService: AlertStreamService,
) {
    private val log = AppLogger.loggerFor(SystemAlertService::class)

    /** Epoch-ms of the last emitted error alert; guards the coalescing window. 0 = never. */
    private val lastErrorAlertAt = AtomicLong(0L)

    /** Re-entrancy guard: prevents an error logged while we handle one from recursing. */
    private val handlingError = ThreadLocal.withInitial { false }

    @PostConstruct
    fun registerErrorListener() {
        AppLogger.setErrorListener { tag, msg -> onServerError(tag, msg) }
    }

    @PreDestroy
    fun unregisterErrorListener() {
        AppLogger.setErrorListener(null)
    }

    /**
     * Notifies admins that [email] just requested an account and is awaiting validation. One event
     * per request (a distinct sign-up is a distinct event), so no throttling is needed here.
     */
    fun raiseAccountPending(email: String, name: String?) {
        val who = name?.takeIf { it.isNotBlank() }?.let { "$it ($email)" } ?: email
        emit(
            source = AlertSource.ACCOUNT,
            severity = AlertSeverity.MEDIUM,
            ruleName = "Account validation",
            message = "New account awaiting approval: $who",
        )
    }

    /**
     * Called for every server-side error log. Emits at most one coalesced notification per
     * [ERROR_COOLDOWN_MS] window; the actual error detail stays in the server logs, the phone only
     * learns that *something* went wrong (as requested).
     */
    private fun onServerError(tag: String, msg: String) {
        if (handlingError.get()) return
        val now = System.currentTimeMillis()
        val last = lastErrorAlertAt.get()
        if (now - last < ERROR_COOLDOWN_MS) return
        // Only the thread that wins the CAS emits; concurrent errors in the same window are dropped.
        if (!lastErrorAlertAt.compareAndSet(last, now)) return

        handlingError.set(true)
        try {
            emit(
                source = AlertSource.ERROR,
                severity = AlertSeverity.HIGH,
                ruleName = "Server error",
                message = "An error occurred on the server. Check the logs for details.",
            )
        } finally {
            handlingError.set(false)
        }
    }

    /**
     * Persists then broadcasts a non-metric event. Wrapped so a delivery/DB failure can never
     * propagate into a caller — especially the error listener, where an escaping exception would be
     * logged as another error and loop.
     */
    private fun emit(source: AlertSource, severity: AlertSeverity, ruleName: String, message: String) {
        runCatching {
            val saved = eventRepository.save(
                AlertEvent(source = source, ruleName = ruleName, severity = severity, message = message)
            )
            alertStreamService.broadcast(saved)
        }.onFailure {
            // Print only — going through AppLogger.error here would re-enter the listener.
            System.err.println("Failed to emit $source alert: ${it.message}")
        }
    }

    private companion object {
        /** Minimum gap between two error notifications. Also caps how often errors can repeat. */
        const val ERROR_COOLDOWN_MS = 5 * 60 * 1000L
    }
}
