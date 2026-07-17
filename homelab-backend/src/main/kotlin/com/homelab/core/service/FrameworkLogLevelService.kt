package com.homelab.core.service

import com.homelab.sdk.helper.AppLogger
import jakarta.annotation.PostConstruct
import org.springframework.boot.logging.LogLevel
import org.springframework.boot.logging.LoggingSystem
import org.springframework.stereotype.Service

/**
 * Bridges [AppLogger]'s level onto the real Spring/Logback logging system, so switching the
 * admin-panel log level also gates Spring, Hibernate (including SQL statement logging, which
 * otherwise bypasses SLF4J entirely via `show-sql`), Tomcat, etc. - not just the app's own
 * AppLogger.debug/info/... calls. Setting the ROOT logger's level is enough: none of those
 * loggers have a more specific level pinned elsewhere, so they all inherit from ROOT.
 *
 * `org.hibernate` as a whole is floored to WARN in application.properties (transaction lifecycle,
 * SQL AST tree dumps, connection-pool housekeeping - never useful). `org.hibernate.SQL`, which
 * only ever logs at DEBUG, is re-enabled here explicitly so the actual SQL statement text still
 * follows the toggle - visible in DEBUG mode, hidden at INFO and above - same as `show-sql` used
 * to always show it, just gated now.
 */
@Service
class FrameworkLogLevelService {
    private val loggingSystem = LoggingSystem.get(javaClass.classLoader)

    @PostConstruct
    fun syncToCurrentAppLoggerLevel() = apply(AppLogger.getLevel())

    fun apply(level: AppLogger.Level) {
        val springLevel = level.toSpringLevel()
        loggingSystem.setLogLevel(LoggingSystem.ROOT_LOGGER_NAME, springLevel)
        loggingSystem.setLogLevel("org.hibernate.SQL", springLevel)
    }

    private fun AppLogger.Level.toSpringLevel(): LogLevel = when (this) {
        AppLogger.Level.DEBUG -> LogLevel.DEBUG
        AppLogger.Level.INFO -> LogLevel.INFO
        AppLogger.Level.WARN -> LogLevel.WARN
        AppLogger.Level.ERROR, AppLogger.Level.ERROR_DETAILED -> LogLevel.ERROR
    }
}
