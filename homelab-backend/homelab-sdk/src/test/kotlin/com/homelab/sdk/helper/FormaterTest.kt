package com.homelab.sdk.helper

import com.homelab.sdk.helper.Formater.Companion.SizeValue
import org.junit.jupiter.api.Assertions.assertEquals
import org.junit.jupiter.api.Assertions.assertTrue
import org.junit.jupiter.api.Test

class FormaterTest {

    @Test
    fun `round rounds half up to the given decimals`() {
        assertEquals(1.23, Formater.round(1.225, 2))
        assertEquals(1.24, Formater.round(1.235, 2))
        assertEquals(2.0, Formater.round(2.0, 2))
    }

    @Test
    fun `formatDoubleToBestSizeUnit returns zero KB for non-positive input`() {
        assertEquals(SizeValue(0.0, "KB"), Formater.formatDoubleToBestSizeUnit(0.0))
        assertEquals(SizeValue(0.0, "KB"), Formater.formatDoubleToBestSizeUnit(-5.0))
    }

    @Test
    fun `formatDoubleToBestSizeUnit picks KB below one MB`() {
        val result = Formater.formatDoubleToBestSizeUnit(2048.0)
        assertEquals("KB", result.unit)
        assertEquals(2.0, result.value)
    }

    @Test
    fun `formatDoubleToBestSizeUnit picks MB below one GB`() {
        val result = Formater.formatDoubleToBestSizeUnit(5.0 * 1024.0 * 1024.0)
        assertEquals("MB", result.unit)
        assertEquals(5.0, result.value)
    }

    @Test
    fun `formatDoubleToBestSizeUnit picks GB at or above one GB`() {
        val result = Formater.formatDoubleToBestSizeUnit(2.5 * 1024.0 * 1024.0 * 1024.0)
        assertEquals("GB", result.unit)
        assertEquals(2.5, result.value)
    }

    @Test
    fun `formatGigabytesToBestSizeUnit converts gigabytes then picks best unit`() {
        val result = Formater.formatGigabytesToBestSizeUnit(0.5)
        assertEquals("MB", result.unit)
        assertEquals(512.0, result.value)
    }

    @Test
    fun `camelToSnake converts camelCase to snake_case`() {
        assertEquals("hello_world", Formater.camelToSnake("helloWorld"))
        assertEquals("original_filename", Formater.camelToSnake("originalFilename"))
        assertEquals("already_snake", Formater.camelToSnake("already_snake"))
        assertEquals("id", Formater.camelToSnake("id"))
    }

    @Test
    fun `bytesToGigabytes converts long bytes`() {
        val gb = 1024.0 * 1024.0 * 1024.0
        assertEquals(1.0, Formater.bytesToGigabytes(gb.toLong()))
    }

    @Test
    fun `bytesToGigabytes converts double bytes`() {
        val gb = 1024.0 * 1024.0 * 1024.0
        assertEquals(2.0, Formater.bytesToGigabytes(gb * 2))
    }

    @Test
    fun `gigabytesToBytes converts gigabytes to bytes`() {
        assertEquals(1024L * 1024L * 1024L, Formater.gigabytesToBytes(1.0))
    }

    @Test
    fun `formatBytes formats below 1024 as raw bytes`() {
        assertEquals("512 B", Formater.formatBytes(512))
    }

    @Test
    fun `formatBytes formats kilobytes megabytes and gigabytes with unit suffix`() {
        // the decimal separator depends on the default locale (dot vs comma), so match both
        assertTrue(Formater.formatBytes(1024).matches(Regex("1[.,]0 KB")))
        assertTrue(Formater.formatBytes(1024L * 1024L).matches(Regex("1[.,]0 MB")))
        assertTrue(Formater.formatBytes(1024L * 1024L * 1024L).matches(Regex("1[.,]0 GB")))
    }
}
