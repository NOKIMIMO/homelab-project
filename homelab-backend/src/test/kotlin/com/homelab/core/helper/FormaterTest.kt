package com.homelab.core.helper

import com.homelab.core.helper.Formater.Companion.SizeValue
import org.junit.jupiter.api.Assertions.assertEquals
import org.junit.jupiter.api.Assertions.assertTrue
import org.junit.jupiter.api.Test

class FormaterTest {

    @Test
    fun `round rounds half up to the given decimals`() {
        assertEquals(1.23, Formater.round(1.225, 2))
        assertEquals(2.0, Formater.round(2.0, 2))
    }

    @Test
    fun `formatDoubleToBestSizeUnit returns zero KB for non-positive input`() {
        assertEquals(SizeValue(0.0, "KB"), Formater.formatDoubleToBestSizeUnit(0.0))
        assertEquals(SizeValue(0.0, "KB"), Formater.formatDoubleToBestSizeUnit(-1.0))
    }

    @Test
    fun `formatDoubleToBestSizeUnit picks the largest unit that stays above one`() {
        assertEquals("KB", Formater.formatDoubleToBestSizeUnit(2048.0).unit)
        assertEquals("MB", Formater.formatDoubleToBestSizeUnit(5.0 * 1024.0 * 1024.0).unit)
        assertEquals("GB", Formater.formatDoubleToBestSizeUnit(2.0 * 1024.0 * 1024.0 * 1024.0).unit)
    }

    @Test
    fun `formatGigabytesToBestSizeUnit converts to bytes before formatting`() {
        val result = Formater.formatGigabytesToBestSizeUnit(0.5)
        assertEquals("MB", result.unit)
        assertEquals(512.0, result.value)
    }

    @Test
    fun `camelToSnake converts camelCase to snake_case`() {
        assertEquals("hello_world", Formater.camelToSnake("helloWorld"))
        assertEquals("id", Formater.camelToSnake("id"))
    }

    @Test
    fun `bytesToGigabytes handles both long and double overloads`() {
        val oneGbInBytes = 1024.0 * 1024.0 * 1024.0
        assertEquals(1.0, Formater.bytesToGigabytes(oneGbInBytes.toLong()))
        assertEquals(2.0, Formater.bytesToGigabytes(oneGbInBytes * 2))
    }

    @Test
    fun `formatBytes formats raw bytes and each unit suffix`() {
        // the decimal separator depends on the default locale (dot vs comma), so match both
        assertEquals("512 B", Formater.formatBytes(512))
        assertTrue(Formater.formatBytes(1024).matches(Regex("1[.,]0 KB")))
        assertTrue(Formater.formatBytes(1024L * 1024L).matches(Regex("1[.,]0 MB")))
        assertTrue(Formater.formatBytes(1024L * 1024L * 1024L).matches(Regex("1[.,]0 GB")))
    }
}
