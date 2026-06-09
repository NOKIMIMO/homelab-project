package com.homelab.core.helper

import java.time.LocalDateTime
import java.time.format.DateTimeFormatter
import kotlin.reflect.KClass

/**
 * Simple application logger singleton used across the project.
 *
 * Usage examples:
 *  val log = AppLogger.loggerFor(MyClass::class)
 *  log.info("message")
 *  log.debug("detailed message")
 *  log.error("error while doing X", exception)
 */
object AppLogger {
	enum class Level { DEBUG, INFO, WARN, ERROR, ERROR_DETAILED }

	private val timeFormatter: DateTimeFormatter = DateTimeFormatter.ofPattern("yyyy-MM-dd HH:mm:ss.SSS")

	@Volatile
	private var level: Level = Level.DEBUG

	fun setLevel(l: Level) {
		level = l
	}

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

	fun debug(tag: String = "", msg: String) {
		if (!shouldLog(Level.DEBUG)) return
		val caller = findCaller()
		val prefix = if (tag.isBlank()) "" else "[$tag] "
		println("${now()} [DEBUG] $prefix($caller) $msg")
	}

	fun info(tag: String = "", msg: String) {
		if (!shouldLog(Level.INFO)) return
		val caller = findCaller()
		val prefix = if (tag.isBlank()) "" else "[$tag] "
		println("${now()} [INFO ] $prefix($caller) $msg")
	}

	fun warn(tag: String = "", msg: String) {
		if (!shouldLog(Level.WARN)) return
		val caller = findCaller()
		val prefix = if (tag.isBlank()) "" else "[$tag] "
		System.err.println("${now()} [WARN ] $prefix($caller) $msg")
	}

	fun error(tag: String = "", msg: String, t: Throwable? = null) {
		if (!shouldLog(Level.ERROR)) return
		val caller = findCaller()
		val prefix = if (tag.isBlank()) "" else "[$tag] "
		System.err.println("${now()} [ERROR] $prefix($caller) $msg")
		if (level == Level.ERROR_DETAILED) t?.printStackTrace()
	}

	/** Lightweight logger bound to a tag (typically a class/file name). */
	class Logger(private val tag: String) {
		fun debug(msg: String) = debug(tag, msg)
		fun info(msg: String) = info(tag, msg)
		fun warn(msg: String) = warn(tag, msg)
		fun error(msg: String, t: Throwable? = null) = AppLogger.error(tag, msg, t)
	}

	fun loggerFor(tag: String) = Logger(tag)
	fun loggerFor(clazz: KClass<*>) = Logger(clazz.simpleName ?: clazz.qualifiedName ?: "Unknown")
	inline fun <reified T> logger() = loggerFor(T::class)
}