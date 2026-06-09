package com.homelab.core.service.module.sql

import com.homelab.sdk.data.ColumnTyping
import java.util.UUID

class SQLHelper {
    companion object {
        fun safeSqlName(name: String): String {
            val normalized = name.trim()
                .replace(Regex("[^a-zA-Z0-9_]"), "_")
                .lowercase()

            require(normalized.matches(Regex("[a-z_][a-z0-9_]*"))) {
                "Invalid SQL name: $name"
            }

            return normalized
        }
        fun dataTypeConversion(typeDef: ColumnTyping, raw: Any?): Any? {
            return when (typeDef) {
                ColumnTyping.string -> raw?.toString()
                ColumnTyping.file -> raw?.toString()
                ColumnTyping.int -> when (raw) {
                    is Number -> raw.toInt()
                    is String -> raw.toIntOrNull()
                    else -> null
                }
                ColumnTyping.long -> when (raw) {
                    is Number -> raw.toLong()
                    is String -> raw.toLongOrNull()
                    else -> null
                }
                ColumnTyping.boolean -> when (raw) {
                    is Boolean -> raw
                    is String -> raw.equals("true", true)
                    is Number -> raw.toInt() != 0
                    else -> null
                }
                ColumnTyping.date -> when (raw) {
                    is java.sql.Date -> raw
                    is String -> try { java.sql.Date.valueOf(raw) } catch (_: Exception) { null }
                    else -> null
                }
                ColumnTyping.datetime -> when (raw) {
                    is java.sql.Timestamp -> raw
                    is String -> try { java.sql.Timestamp.valueOf(raw) } catch (_: Exception) { null }
                    else -> null
                }
            }
        }

        // ambiguous typing because it will define it
         fun convertFilterValue(value: Any?): Any? {
            if (value == null) return null
            if (value is String) {
                val s = value.trim()
                //UUID CHECKER
                // definetly not the best way to do this but it works => send to helper or use lib
                val uuidRegex = Regex("^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}$")
                if (uuidRegex.matches(s)) {
                    return try {
                        UUID.fromString(s)
                    } catch (_: Exception) {
                        s
                    }
                }
                // BOOLEAN CHECKER
                if (s.equals("true", true) || s.equals("false", true)) return s.equals("true", true)
                s.toIntOrNull()?.let { return it }
                s.toLongOrNull()?.let { return it }
                // DATE / DATETIME CHECKER:
                // timestamp with optional fractional seconds (e.g. 2026-05-11 14:40:39.280527)
                try {
                    return java.sql.Timestamp.valueOf(s)
                } catch (_: Exception) {
                    // not a full timestamp
                }
                // date-only (yyyy-[m]m-[d]d)
                try {
                    return java.sql.Date.valueOf(s)
                } catch (_: Exception) {
                    // not a date
                }
                return s
            }
            return value
        }
    }
}