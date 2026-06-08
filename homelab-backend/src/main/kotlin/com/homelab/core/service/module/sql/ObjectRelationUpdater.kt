package com.homelab.core.service.module.sql

import com.homelab.sdk.data.Cardinality
import com.homelab.sdk.data.RelationDefinition

class ObjectRelationUpdater {
    companion object {


        fun updateRelations(
            schemaName: String,
            sourceTable: String,
            relation: RelationDefinition
        ): String {
            //At this point it's supposed that basic table with no relation exist already
            // TODO: potential issue if relation is of relation, then we've got a first come first served issue coming
            // To Check later

            val targetTable = relation.targetTable
            val targetSchema = relation.targetObject
            return when (relation.cardinality) {
                Cardinality.MANY_TO_MANY -> buildManyToManySql(schemaName, sourceTable, targetSchema, targetTable, relation)
                Cardinality.ONE_TO_ONE -> buildOneToOneSql(schemaName, sourceTable, targetSchema, targetTable)

                Cardinality.ONE_TO_MANY -> buildOneToManySql(schemaName, sourceTable, targetTable, targetSchema)
                Cardinality.MANY_TO_ONE -> buildOneToManySql(
                    schemaName,
                    targetTable,
                    sourceTable,
                    targetSchema
                ) // reverse of OneToMany
            }
        }

        private fun buildManyToManySql(
            schemaName: String,
            sourceTable: String,
            targetSchema: String,
            targetTable: String,
            relation: RelationDefinition
        ): String {

            val joinTable = listOf(
                sourceTable,
                targetTable
            ).sorted().joinToString("_")

            val sourceFk = "${sourceTable}_id"
            val targetFk = "${targetTable}_id"

            val deleteAction =
                if (relation.cascadeDelete) "CASCADE"
                else "NO ACTION"

            return """
        CREATE TABLE IF NOT EXISTS "$schemaName"."$joinTable" (
            "$sourceFk" UUID NOT NULL,
            "$targetFk" UUID NOT NULL,

            PRIMARY KEY ("$sourceFk", "$targetFk"),

            FOREIGN KEY ("$sourceFk")
                REFERENCES "$schemaName"."$sourceTable"(id)
                ON DELETE $deleteAction,

            FOREIGN KEY ("$targetFk")
                REFERENCES "$targetSchema"."$targetTable"(id)
                ON DELETE $deleteAction
        )
    """.trimIndent()
        }

        private fun buildOneToManySql(
            schemaName: String,
            oneTable: String,
            manyTable: String,
            targetSchema: String
        ): String {
            //TODO check for schemaTarget, unsure

            val constraintName =
                "fk_${manyTable}_${oneTable}"

            return """
        ALTER TABLE "$schemaName"."$manyTable"
        ADD COLUMN IF NOT EXISTS "${oneTable}_id" UUID;

        ALTER TABLE "$schemaName"."$manyTable"
        ADD CONSTRAINT $constraintName
        FOREIGN KEY ("${oneTable}_id")
        REFERENCES "$targetSchema"."$oneTable"(id);
    """.trimIndent()
        }

        private fun buildOneToOneSql(
            schemaName: String,
            sourceTable: String,
            targetSchema: String,
            targetTable: String
        ): String {

            val fkCol = "${targetTable}_id"

            return """
        ALTER TABLE "$schemaName"."$sourceTable"
        ADD COLUMN IF NOT EXISTS "$fkCol" UUID UNIQUE;

        ALTER TABLE "$schemaName"."$sourceTable"
        ADD CONSTRAINT fk_${sourceTable}_${targetTable}
        FOREIGN KEY ("$fkCol")
        REFERENCES "$targetSchema"."$targetTable"(id);
    """.trimIndent()
        }
    }
}