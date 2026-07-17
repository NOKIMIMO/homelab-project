package com.homelab.sdk.data

import org.junit.jupiter.api.Assertions.assertEquals
import org.junit.jupiter.api.Assertions.assertThrows
import org.junit.jupiter.api.Test

class DataMapperTest {

    @Test
    fun `mapToColumnTyping maps every known type case-insensitively`() {
        assertEquals(ColumnTyping.string, DataMapper.mapToColumnTyping("string"))
        assertEquals(ColumnTyping.string, DataMapper.mapToColumnTyping("STRING"))
        assertEquals(ColumnTyping.file, DataMapper.mapToColumnTyping("File"))
        assertEquals(ColumnTyping.int, DataMapper.mapToColumnTyping("int"))
        assertEquals(ColumnTyping.long, DataMapper.mapToColumnTyping("long"))
        assertEquals(ColumnTyping.boolean, DataMapper.mapToColumnTyping("boolean"))
        assertEquals(ColumnTyping.date, DataMapper.mapToColumnTyping("date"))
        assertEquals(ColumnTyping.datetime, DataMapper.mapToColumnTyping("datetime"))
    }

    @Test
    fun `mapToColumnTyping throws for unsupported type`() {
        assertThrows(IllegalArgumentException::class.java) {
            DataMapper.mapToColumnTyping("unknown")
        }
    }
}
