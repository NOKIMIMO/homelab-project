package com.homelab.sdk.data

/**
 * Public SDK interface that allows code outside the core module (plugins, tests, etc.)
 * to interact with a module-scoped database provider implemented by the core application.
 *
 * The concrete implementation lives in the core module and implements this interface.
 */
interface ModuleDatabaseService {
    fun ensureModuleDatabaseReady(moduleId: String): Boolean

    fun setUpModuleDataObject(moduleId: String, objectsDefinition: TableDefinition): Boolean

    fun setUpModuleDataObjectRelations(moduleId: String, objectsDefinition: TableDefinition): Boolean

    fun insertRow(
        moduleId: String,
        tableName: String,
        item: Map<String, Any?>,
        definition: TableDefinition
    ): Boolean

    fun queryRows(moduleId: String, tableName: String, filters: Map<String, Any?>): List<Map<String, Any?>>

    fun loadRelationsForRows(moduleId: String, tableName: String, rows: List<Map<String, Any?>>): List<Map<String, Any?>>

    fun deleteRowsByFilters(moduleId: String, tableName: String, filters: Map<String, Any?>): Int

    /**
     * Mise à jour d'enregistrements avec filtres WHERE et colonnes à modifier.
     * @param moduleId ID du module (schéma)
     * @param tableName Nom de la table (sans schéma)
     * @param filters Clause WHERE (ex: {id: "uuid-123", status: "active"})
     * @param updateMap Colonnes à modifier (ex: {photoIds: "id1,id2,id3", updatedAt: now()})
     * @return Nombre de lignes affectées
     */
    fun updateRows(
        moduleId: String,
        tableName: String,
        filters: Map<String, Any?>,
        updateMap: Map<String, Any?>
    ): Int
}
