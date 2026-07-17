package com.homelab.core.service.module.sql

import com.homelab.sdk.data.ColumnTyping
import org.junit.jupiter.api.Assertions.assertEquals
import org.junit.jupiter.api.Assertions.assertFalse
import org.junit.jupiter.api.Assertions.assertNull
import org.junit.jupiter.api.Assertions.assertThrows
import org.junit.jupiter.api.Assertions.assertTrue
import org.junit.jupiter.api.Test
import java.util.UUID

class SQLHelperTest {

    @Test
    fun `safeSqlName lowercases and replaces disallowed characters`() {
        assertEquals("my_table", SQLHelper.safeSqlName("My Table"))
        assertEquals("weird__name", SQLHelper.safeSqlName("weird!!name"))
        assertEquals("already_ok", SQLHelper.safeSqlName("already_ok"))
    }

    @Test
    fun `safeSqlName rejects a name that starts with a digit even after sanitization`() {
        assertThrows(IllegalArgumentException::class.java) { SQLHelper.safeSqlName("123abc") }
    }

    @Test
    fun `safeSqlName rejects a blank name`() {
        assertThrows(IllegalArgumentException::class.java) { SQLHelper.safeSqlName("   ") }
    }

    @Test
    fun `dataTypeConversion converts numeric and string inputs for int and long`() {
        assertEquals(5, SQLHelper.dataTypeConversion(ColumnTyping.int, 5.0))
        assertEquals(5, SQLHelper.dataTypeConversion(ColumnTyping.int, "5"))
        assertNull(SQLHelper.dataTypeConversion(ColumnTyping.int, "not-a-number"))
        assertEquals(5L, SQLHelper.dataTypeConversion(ColumnTyping.long, "5"))
    }

    @Test
    fun `dataTypeConversion converts boolean from multiple representations`() {
        assertEquals(true, SQLHelper.dataTypeConversion(ColumnTyping.boolean, true))
        assertEquals(true, SQLHelper.dataTypeConversion(ColumnTyping.boolean, "true"))
        assertEquals(false, SQLHelper.dataTypeConversion(ColumnTyping.boolean, 0))
        assertEquals(true, SQLHelper.dataTypeConversion(ColumnTyping.boolean, 1))
        assertNull(SQLHelper.dataTypeConversion(ColumnTyping.boolean, listOf(1)))
    }

    @Test
    fun `dataTypeConversion parses date and datetime strings and returns null on failure`() {
        assertEquals(java.sql.Date.valueOf("2026-07-16"), SQLHelper.dataTypeConversion(ColumnTyping.date, "2026-07-16"))
        assertNull(SQLHelper.dataTypeConversion(ColumnTyping.date, "not-a-date"))
        assertEquals(
            java.sql.Timestamp.valueOf("2026-07-16 10:00:00"),
            SQLHelper.dataTypeConversion(ColumnTyping.datetime, "2026-07-16 10:00:00")
        )
        assertNull(SQLHelper.dataTypeConversion(ColumnTyping.datetime, "not-a-timestamp"))
    }

    @Test
    fun `dataTypeConversion passes strings and files through toString unchanged`() {
        assertEquals("42", SQLHelper.dataTypeConversion(ColumnTyping.string, 42))
        assertNull(SQLHelper.dataTypeConversion(ColumnTyping.string, null))
        assertEquals("/tmp/a.png", SQLHelper.dataTypeConversion(ColumnTyping.file, "/tmp/a.png"))
    }

    @Test
    fun `convertFilterValue returns null unchanged`() {
        assertNull(SQLHelper.convertFilterValue(null))
    }

    @Test
    fun `convertFilterValue detects a UUID string`() {
        val uuid = UUID.randomUUID()
        assertEquals(uuid, SQLHelper.convertFilterValue(uuid.toString()))
    }

    @Test
    fun `convertFilterValue detects boolean strings case-insensitively`() {
        assertEquals(true, SQLHelper.convertFilterValue("TRUE"))
        assertEquals(false, SQLHelper.convertFilterValue("false"))
    }

    @Test
    fun `convertFilterValue detects integer and long strings`() {
        assertEquals(42, SQLHelper.convertFilterValue("42"))
        assertEquals(42_000_000_000L, SQLHelper.convertFilterValue("42000000000"))
    }

    @Test
    fun `convertFilterValue detects a full timestamp string`() {
        assertEquals(java.sql.Timestamp.valueOf("2026-05-11 14:40:39.280527"), SQLHelper.convertFilterValue("2026-05-11 14:40:39.280527"))
    }

    @Test
    fun `convertFilterValue detects a date-only string`() {
        assertEquals(java.sql.Date.valueOf("2026-07-16"), SQLHelper.convertFilterValue("2026-07-16"))
    }

    @Test
    fun `convertFilterValue falls back to the trimmed string for plain text`() {
        assertEquals("hello world", SQLHelper.convertFilterValue("  hello world  "))
    }

    @Test
    fun `convertFilterValue returns non-string values unchanged`() {
        assertEquals(3.14, SQLHelper.convertFilterValue(3.14))
    }
}
