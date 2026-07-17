package com.homelab.core.service.module.sql

import com.homelab.sdk.data.UniqueTogetherDefinition
import org.junit.jupiter.api.Assertions.assertTrue
import org.junit.jupiter.api.Test

class ObjectConstraintUpdaterTest {

    @Test
    fun `buildUniqueTogetherSql uses the provided constraint name and quotes every field`() {
        val constraint = UniqueTogetherDefinition(name = "uq_user_group", fields = listOf("userId", "groupId"))

        val sql = ObjectConstraintUpdater.buildUniqueTogetherSql("mod", "memberships", constraint)

        assertTrue(sql.contains("""ADD CONSTRAINT "uq_user_group""""))
        assertTrue(sql.contains("""UNIQUE ("userid", "groupid")"""))
        assertTrue(sql.contains("""ALTER TABLE "mod"."memberships""""))
        assertTrue(sql.contains("c.conname = 'uq_user_group'"))
        assertTrue(sql.contains("n.nspname = 'mod'"))
        assertTrue(sql.contains("t.relname = 'memberships'"))
    }

    @Test
    fun `buildUniqueTogetherSql derives a constraint name from the table and fields when none is given`() {
        val constraint = UniqueTogetherDefinition(name = null, fields = listOf("userId", "groupId"))

        val sql = ObjectConstraintUpdater.buildUniqueTogetherSql("mod", "memberships", constraint)

        assertTrue(sql.contains("""ADD CONSTRAINT "uq_memberships_userid_groupid""""))
    }

    @Test
    fun `buildUniqueTogetherSql sanitizes the table name`() {
        val constraint = UniqueTogetherDefinition(name = "uq_x", fields = listOf("a"))

        val sql = ObjectConstraintUpdater.buildUniqueTogetherSql("mod", "Weird Table", constraint)

        assertTrue(sql.contains("""ALTER TABLE "mod"."weird_table""""))
        assertTrue(sql.contains("t.relname = 'weird_table'"))
    }
}
