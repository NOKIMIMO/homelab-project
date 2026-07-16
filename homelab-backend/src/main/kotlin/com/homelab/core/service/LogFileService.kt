package com.homelab.core.service

import com.homelab.core.config.HomelabConfig
import com.homelab.core.exception.BadRequestException
import org.springframework.stereotype.Service
import java.nio.file.Files
import java.nio.file.Path
import java.nio.file.StandardCopyOption
import java.time.LocalDateTime
import java.time.format.DateTimeFormatter
import kotlin.io.path.name

private val DATED_LOG_FILE = Regex("""homelab-\d{4}-\d{2}-\d{2}\.log""")
private val MANUAL_LOG_FILE = Regex("""homelab-manual-\d{4}-\d{2}-\d{2}_\d{2}-\d{2}-\d{2}\.log""")
private const val CURRENT_LOG_FILE = "homelab.log"
private val MANUAL_TIMESTAMP: DateTimeFormatter = DateTimeFormatter.ofPattern("yyyy-MM-dd_HH-mm-ss")

/**
 * Lists and serves the log dumps living under HomelabConfig.logsPath: the daily automatic ones
 * from logback-spring.xml's ROLLING_FILE appender, and on-demand manual ones (see
 * [createManualDump]). Filenames are only ever accepted against a fixed allow-list pattern -
 * never resolved from arbitrary user input - so this can't be used for path traversal outside the
 * logs directory.
 */
@Service
class LogFileService(private val homelabConfig: HomelabConfig) {

    data class LogFileInfo(
        val name: String,
        val sizeBytes: Long,
        val current: Boolean,
        val lastModified: Long,
    )

    private fun logsDir(): Path = Path.of(homelabConfig.logsPath)

    fun list(): List<LogFileInfo> {
        val dir = logsDir()
        if (!Files.isDirectory(dir)) return emptyList()
        Files.list(dir).use { stream ->
            return stream
                .filter { Files.isRegularFile(it) && isKnownLogFile(it.name) }
                .map {
                    LogFileInfo(
                        name = it.name,
                        sizeBytes = Files.size(it),
                        current = it.name == CURRENT_LOG_FILE,
                        lastModified = Files.getLastModifiedTime(it).toMillis(),
                    )
                }
                .sorted(compareByDescending { it.lastModified })
                .toList()
        }
    }

    /**
     * Snapshots the currently-open log file into a standalone "manual" dump, named with a
     * `manual` suffix + timestamp so it's distinguishable from the automatic daily ones. This
     * copies the file rather than forcing/resetting the appender's rollover: Logback keeps the
     * live file open for writing throughout, and truncating or renaming a file out from under an
     * open write handle is unsafe on some platforms - a plain copy leaves it untouched.
     */
    fun createManualDump(): LogFileInfo {
        val current = logsDir().resolve(CURRENT_LOG_FILE)
        if (!Files.isRegularFile(current)) {
            throw BadRequestException("No current log file to dump yet")
        }
        val name = "homelab-manual-${LocalDateTime.now().format(MANUAL_TIMESTAMP)}.log"
        val target = logsDir().resolve(name)
        Files.copy(current, target, StandardCopyOption.COPY_ATTRIBUTES)
        return LogFileInfo(
            name = name,
            sizeBytes = Files.size(target),
            current = false,
            lastModified = Files.getLastModifiedTime(target).toMillis(),
        )
    }

    fun resolveForDownload(filename: String): Path {
        if (!isKnownLogFile(filename)) {
            throw BadRequestException("Invalid log file name: $filename")
        }
        val path = logsDir().resolve(filename)
        if (!Files.isRegularFile(path)) {
            throw BadRequestException("Log file not found: $filename")
        }
        return path
    }

    private fun isKnownLogFile(filename: String): Boolean =
        filename == CURRENT_LOG_FILE || DATED_LOG_FILE.matches(filename) || MANUAL_LOG_FILE.matches(filename)
}
