package com.homelab.core.parser

import org.junit.jupiter.api.Assertions.assertEquals
import org.junit.jupiter.api.Assertions.assertNull
import org.junit.jupiter.api.Assertions.assertSame
import org.junit.jupiter.api.Test
import org.w3c.dom.Element

class ParserFactoryTest {

    private class StubParser(private val value: String) : Parser<String> {
        override fun parse(element: Element, moduleId: String?): String = value
    }

    @Test
    fun `getParser returns null for an unregistered type`() {
        assertNull(ParserFactory.getParser<String>("never-registered-${System.nanoTime()}"))
    }

    @Test
    fun `register then getParser returns the same parser instance`() {
        val type = "stub-${System.nanoTime()}"
        val parser = StubParser("hello")

        ParserFactory.register(type, parser)

        assertSame(parser, ParserFactory.getParser<String>(type))
    }

    @Test
    fun `register overwrites a previously registered parser for the same type`() {
        val type = "stub-overwrite-${System.nanoTime()}"
        ParserFactory.register(type, StubParser("first"))
        val second = StubParser("second")

        ParserFactory.register(type, second)

        assertSame(second, ParserFactory.getParser<String>(type))
        assertEquals("second", ParserFactory.getParser<String>(type)?.parse(dummyElement(), null))
    }

    private fun dummyElement(): Element {
        val factory = javax.xml.parsers.DocumentBuilderFactory.newInstance()
        val document = factory.newDocumentBuilder().newDocument()
        return document.createElement("root")
    }
}
