package com.homelab.core.parser

object ParserFactory {
    private val parsers = mutableMapOf<String, Parser<*>>()

    fun <T> register(type: String, parser: Parser<T>) {
        parsers[type] = parser
    }

    fun <T> getParser(type: String): Parser<T>? {
        @Suppress("UNCHECKED_CAST")
        return parsers[type] as? Parser<T>
    }
}
