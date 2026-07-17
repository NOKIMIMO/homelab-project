package com.homelab.core.service.module.sql

import com.homelab.sdk.data.Cardinality
import com.homelab.sdk.data.RelationDefinition
import org.junit.jupiter.api.Assertions.assertTrue
import org.junit.jupiter.api.Test

class ObjectRelationUpdaterTest {

    @Test
    fun `updateRelations for MANY_TO_MANY creates a sorted join table with both foreign keys`() {
        val relation = RelationDefinition(
            targetObject = "weather_mod",
            targetTable = "cities",
            cardinality = Cardinality.MANY_TO_MANY,
            cascadeDelete = true
        )

        val sql = ObjectRelationUpdater.updateRelations("photos_mod", "albums", relation)

        assertTrue(sql.contains("""CREATE TABLE IF NOT EXISTS "photos_mod"."albums_cities""""))
        assertTrue(sql.contains(""""albums_id" UUID NOT NULL"""))
        assertTrue(sql.contains(""""cities_id" UUID NOT NULL"""))
        assertTrue(sql.contains("""PRIMARY KEY ("albums_id", "cities_id")"""))
        assertTrue(sql.contains("""REFERENCES "photos_mod"."albums"(id)"""))
        assertTrue(sql.contains("""REFERENCES "weather_mod"."cities"(id)"""))
        assertTrue(sql.contains("ON DELETE CASCADE"))
    }

    @Test
    fun `updateRelations for MANY_TO_MANY defaults to NO ACTION when cascadeDelete is false`() {
        val relation = RelationDefinition(
            targetObject = "weather_mod",
            targetTable = "cities",
            cardinality = Cardinality.MANY_TO_MANY,
            cascadeDelete = false
        )

        val sql = ObjectRelationUpdater.updateRelations("photos_mod", "albums", relation)

        assertTrue(sql.contains("ON DELETE NO ACTION"))
        assertTrue(!sql.contains("ON DELETE CASCADE"))
    }

    @Test
    fun `updateRelations for ONE_TO_ONE adds a unique foreign key column on the source table`() {
        val relation = RelationDefinition(
            targetObject = "weather_mod",
            targetTable = "cities",
            cardinality = Cardinality.ONE_TO_ONE
        )

        val sql = ObjectRelationUpdater.updateRelations("photos_mod", "profile", relation)

        assertTrue(sql.contains("""ALTER TABLE "photos_mod"."profile""""))
        assertTrue(sql.contains(""""cities_id" UUID UNIQUE"""))
        assertTrue(sql.contains("ADD CONSTRAINT fk_profile_cities"))
        assertTrue(sql.contains("""REFERENCES "weather_mod"."cities"(id)"""))
    }

    @Test
    fun `updateRelations for ONE_TO_MANY adds the foreign key on the target (many-side) table`() {
        val relation = RelationDefinition(
            targetObject = "photos_mod",
            targetTable = "photos",
            cardinality = Cardinality.ONE_TO_MANY
        )

        val sql = ObjectRelationUpdater.updateRelations("albums_mod", "albums", relation)

        assertTrue(sql.contains("""ALTER TABLE "albums_mod"."photos""""))
        assertTrue(sql.contains(""""albums_id" UUID"""))
        assertTrue(sql.contains("fk_photos_albums"))
    }

    @Test
    fun `updateRelations sanitizes the target schema and table names`() {
        val relation = RelationDefinition(
            targetObject = "Weather Mod",
            targetTable = "Cities Table",
            cardinality = Cardinality.ONE_TO_ONE
        )

        val sql = ObjectRelationUpdater.updateRelations("photos_mod", "profile", relation)

        assertTrue(sql.contains(""""cities_table_id" UUID UNIQUE"""))
        assertTrue(sql.contains("""REFERENCES "weather_mod"."cities_table"(id)"""))
    }
}
