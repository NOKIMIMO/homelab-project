package com.homelab.sdk.helper

import java.time.LocalDateTime
import java.time.format.DateTimeFormatter
import kotlin.reflect.KClass

object AppLogger {
	enum class Level { DEBUG, INFO, WARN, ERROR, ERROR_DETAILED }

	data class LogEntry(
		val timestamp: String,
		val level: String,
		val tag: String,
		val message: String,
		val caller: String
	)

	private val timeFormatter: DateTimeFormatter = DateTimeFormatter.ofPattern("yyyy-MM-dd HH:mm:ss.SSS")

	@Volatile
	private var level: Level = Level.DEBUG

	private val logBuffer = ArrayDeque<LogEntry>()
	private const val MAX_BUFFER_SIZE = 500

	fun setLevel(l: Level) { level = l }
	fun getLevel(): Level = level

	/**
	 * Optional sink notified on every [error] call (tag, message). Lets a higher layer (e.g. the
	 * backend's alert pipeline) turn server errors into a user notification without the SDK having to
	 * know about it. Kept as a single nullable callback so the SDK stays framework-free; the listener
	 * is responsible for its own throttling/coalescing and must not throw (failures are swallowed).
	 */
	@Volatile
	private var errorListener: ((tag: String, msg: String) -> Unit)? = null

	fun setErrorListener(l: ((tag: String, msg: String) -> Unit)?) { errorListener = l }

	private fun now(): String = LocalDateTime.now().format(timeFormatter)

	private fun shouldLog(l: Level): Boolean = when (level) {
		Level.DEBUG -> true
		Level.INFO -> l != Level.DEBUG
		Level.WARN -> l == Level.WARN || l == Level.ERROR
		Level.ERROR -> l == Level.ERROR
		Level.ERROR_DETAILED -> l == Level.ERROR || l == Level.ERROR_DETAILED
	}

	/** Find the first stack frame outside the logger implementation to report file:line. */
	private fun findCaller(): String {
		val stack = Throwable().stackTrace
		val loggerClassName = AppLogger::class.qualifiedName ?: "com.homelab.core.helper.AppLogger"
		for (el in stack) {
			val cn = el.className
			val file = el.fileName ?: continue
			if (cn.startsWith(loggerClassName)) continue
			if (cn.startsWith("kotlin.") || cn.startsWith("java.") || cn.startsWith("sun.reflect.")) continue
			if (file == "AppLogger.kt") continue
			val line = el.lineNumber
			return "$file:$line"
		}
		return "Unknown:0"
	}

	private fun store(levelStr: String, tag: String, msg: String, caller: String) {
		val entry = LogEntry(now(), levelStr, tag, msg, caller)
		synchronized(logBuffer) {
			if (logBuffer.size >= MAX_BUFFER_SIZE) logBuffer.removeFirst()
			logBuffer.addLast(entry)
		}
	}

	fun getLogs(): List<LogEntry> = synchronized(logBuffer) { logBuffer.toList() }

	fun clearLogs() = synchronized(logBuffer) { logBuffer.clear() }

	fun debug(tag: String = "", msg: String) {
		if (!shouldLog(Level.DEBUG)) return
		val caller = findCaller()
		val prefix = if (tag.isBlank()) "" else "[$tag] "
		println("${now()} [DEBUG] $prefix($caller) $msg")
		store("DEBUG", tag, msg, caller)
	}

	fun info(tag: String = "", msg: String) {
		if (!shouldLog(Level.INFO)) return
		val caller = findCaller()
		val prefix = if (tag.isBlank()) "" else "[$tag] "
		println("${now()} [INFO ] $prefix($caller) $msg")
		store("INFO", tag, msg, caller)
	}

	fun warn(tag: String = "", msg: String) {
		if (!shouldLog(Level.WARN)) return
		val caller = findCaller()
		val prefix = if (tag.isBlank()) "" else "[$tag] "
		System.err.println("${now()} [WARN ] $prefix($caller) $msg")
		store("WARN", tag, msg, caller)
	}

	fun error(tag: String = "", msg: String, t: Throwable? = null) {
		if (!shouldLog(Level.ERROR)) return
		val caller = findCaller()
		val prefix = if (tag.isBlank()) "" else "[$tag] "
		System.err.println("${now()} [ERROR] $prefix($caller) $msg")
		if (level == Level.ERROR_DETAILED) t?.printStackTrace()
		store("ERROR", tag, msg, caller)
		// Notify the optional sink last, guarded: a throwing/logging listener must never break logging
		// or recurse back into error().
		errorListener?.let { listener -> runCatching { listener(tag, msg) } }
	}

	/** Lightweight logger bound to a tag (typically a class/file name). */
	class Logger(private val tag: String) {
		fun debug(msg: String) = debug(tag, msg)
		fun info(msg: String) = info(tag, msg)
		fun warn(msg: String) = warn(tag, msg)
		fun error(msg: String, t: Throwable? = null) = error(tag, msg, t)
	}

	fun loggerFor(tag: String) = Logger(tag)
	fun loggerFor(clazz: KClass<*>) = Logger(clazz.simpleName ?: clazz.qualifiedName ?: "Unknown")
	inline fun <reified T> logger() = loggerFor(T::class)
}
