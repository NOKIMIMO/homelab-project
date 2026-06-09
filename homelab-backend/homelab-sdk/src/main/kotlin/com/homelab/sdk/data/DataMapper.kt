package com.homelab.sdk.data

class DataMapper {

    companion object{
        fun mapToColumnTyping(type: String): ColumnTyping {
            return when (type.lowercase()) {
                "string" -> ColumnTyping.string
                "file" -> ColumnTyping.file
                "int" -> ColumnTyping.int
                "long" -> ColumnTyping.long
                "boolean" -> ColumnTyping.boolean
                "date" -> ColumnTyping.date
                "datetime" -> ColumnTyping.datetime
                else -> throw IllegalArgumentException("Unsupported column type: $type")
            }
        }
    }
}