package com.homelab.core.service.module.sql

import com.homelab.core.service.module.sql.SQLHelper.Companion.safeSqlName
import com.homelab.sdk.data.UniqueTogetherDefinition

class ObjectConstraintUpdater {
    companion object {
        fun buildUniqueTogetherSql(
            schemaName: String,
            tableName: String,
            constraint: UniqueTogetherDefinition
        ): String {
            val safeTable = safeSqlName(tableName)

            val fieldsSql = constraint.fields.joinToString(", ") {
                "\"${safeSqlName(it)}\""
            }

            val constraintName = safeSqlName(
                constraint.name ?: "uq_${safeTable}_${constraint.fields.joinToString("_")}"
            )

            return """
                DO $$
                BEGIN
                    IF NOT EXISTS (
                        SELECT 1
                        FROM pg_constraint c
                        JOIN pg_class t ON t.oid = c.conrelid
                        JOIN pg_namespace n ON n.oid = t.relnamespace
                        WHERE c.conname = '$constraintName'
                          AND n.nspname = '$schemaName'
                          AND t.relname = '$safeTable'
                    ) THEN
                        ALTER TABLE "$schemaName"."$safeTable"
                        ADD CONSTRAINT "$constraintName"
                        UNIQUE ($fieldsSql);
                    END IF;
                END $$;
            """.trimIndent()
        }
    }
}