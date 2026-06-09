package com.homelab.core.service

import com.homelab.core.config.HomelabConfig
import com.homelab.core.model.action.*
import com.homelab.sdk.module.action.ModuleActionDeclaration
import com.homelab.core.action.ActionFactory
import com.homelab.core.helper.AppLogger
import com.homelab.core.parser.ModuleDataObjectParser
import com.homelab.core.service.module.ModuleDatabaseService
import com.homelab.sdk.action.Action
import com.homelab.sdk.data.Cardinality
import com.homelab.sdk.data.ColumnDefinition
import com.homelab.sdk.data.ColumnTyping
import com.homelab.sdk.data.GenericTableLayer
import com.homelab.sdk.data.TableDefinition
import org.springframework.stereotype.Service
import java.io.File

@Service
class AppletService(
    private val moduleDatabaseService: ModuleDatabaseService,
    private val homelabConfig: HomelabConfig,
    private val actionFactory: ActionFactory
) {
    private val log = AppLogger.loggerFor(AppletService::class)
    fun invokeFunctionOfModule(
        id: String,
        mergedParams: Map<String, Any>,
        decl: ModuleActionDeclaration,
        resolvedLogic: List<Map<String, Any>>): Map<String, Any?>{
        val errorList = mutableListOf<String>()

        //param validation
        for (declaredParam in decl.parameters) {
            if (declaredParam.type == com.homelab.sdk.module.action.ModuleActionParameterType.NONE) {
                if (!declaredParam.optional && declaredParam.name !in mergedParams) {
                    errorList.add("Missing parameter ${declaredParam.name}")
                }
            }
        }
        if (errorList.isNotEmpty()){
            return mapOf("success" to false, "errors" to errorList)
        }
        // logic validation
        var targetModuleId = id
        var targetObjectName = decl.actUponObject
        val paramWithRelation = decl.parameters.firstOrNull { !it.relation.isNullOrBlank() }
        if (paramWithRelation != null) {
            val rel = paramWithRelation.relation!!
            val dot = rel.indexOf('.')
            if (dot > 0) {
                targetModuleId = rel.substring(0, dot)
                targetObjectName = rel.substring(dot + 1)
            } else {
                // fallback: relation provided object only, keep current module id
                targetObjectName = rel
            }
        }
        val resolvedObject = run {
            val file = File(homelabConfig.modulesScanPath, "$targetModuleId/$targetObjectName").canonicalFile
            if (!file.exists()) {
                error("Data object XML not found: ${file.absolutePath}")
            }
            val xml = file.readText()
            ModuleDataObjectParser.parseFromXml(xml, targetModuleId)
        }

        val sourceDef = resolvedObject
        val sourceModule = id

        val actionReturn = mutableMapOf<String, Any?>()
        for (actionDecl in resolvedLogic) {
            val actionType = actionDecl["type"] as String
            val action: Action? = actionFactory.resolve(actionType)

            var objectDefForAction: TableDefinition = sourceDef
            var moduleForAction: String = sourceModule
            var paramsForAction: Map<String, Any> = mergedParams

            // If a parameter declares a relation and the client provided that parameter, we may need to
            // route the DB op to a different table (join table, target table, or set a FK on source).
            val relationParam = decl.parameters.firstOrNull { it.relation != null && mergedParams.containsKey(it.name) }

            if (relationParam != null) {
                // Normalize the relation string; allow "mod.object.xml" or "mod.object" or "object.xml"
                val relRaw = relationParam.relation!!.removeSuffix(".xml")
                val dot = relRaw.indexOf('.')
                val relModule = if (dot > 0) relRaw.substring(0, dot) else sourceModule
                val relObjectNameOrFile = if (dot > 0) relRaw.substring(dot + 1) else relRaw
                val relFile = File(homelabConfig.modulesScanPath, "$relModule/$relObjectNameOrFile").canonicalFile
                if (relFile.exists()) {
                    val targetDef = ModuleDataObjectParser.parseFromXml(relFile.readText(), relModule)

                    // Find the relation declared on the source object that points to this target table.
                    // RelationDefinition: targetObject == moduleName, targetTable == dataObject name
                    val declaredRelation = sourceDef.relations.firstOrNull { r ->
                        r.targetTable == targetDef.name
                    }

                    if (declaredRelation != null) {
                        when (declaredRelation.cardinality) {
                            // join table search
                            Cardinality.MANY_TO_MANY -> {
                                val joinTableName = listOf(sourceDef.name, targetDef.name).sorted().joinToString("_")
                                val fkSourceCol = "${sourceDef.name}_id"
                                val fkTargetCol = "${targetDef.name}_id"

                                objectDefForAction = TableDefinition(
                                    name = joinTableName,
                                    columns = listOf(
                                        ColumnDefinition(fkSourceCol, ColumnTyping.string, unique = false, nullable = false, regex = null),
                                        ColumnDefinition(fkTargetCol, ColumnTyping.string, unique = false, nullable = false, regex = null)
                                    ),
                                    autoGeneratedColumns = emptyList(),
                                    relations = emptyList()
                                )
                                moduleForAction = sourceModule

                                val m = mutableMapOf<String, Any>()
                                val sourceIdVal = mergedParams["id"] ?: mergedParams["${sourceDef.name}_id"]
                                if (sourceIdVal != null) m[fkSourceCol] = sourceIdVal
                                val targetVal = mergedParams[relationParam.name]
                                if (targetVal != null) m[fkTargetCol] = targetVal
                                paramsForAction = m.toMap()
                            }

                            // For ONE_TO_MANY, we assume the FK is on the target table pointing back to source.
                            // So we operate on targetDef and set that FK.
                            Cardinality.ONE_TO_MANY -> {
                                // CREATE usually inserts into target table with FK pointing to source
                                // So operate on targetDef and set target FK '<source>_id' to the provided source id
                                objectDefForAction = targetDef
                                moduleForAction = declaredRelation.targetObject
                                val fkOnTarget = "${sourceDef.name}_id"
                                val m = mutableMapOf<String, Any>()
                                // Copy any target-relevant params (basic heuristic: if param name matches a target column)
                                // We at least set the fk to source id
                                val sourceIdVal = mergedParams["id"] ?: mergedParams["${sourceDef.name}_id"]
                                if (sourceIdVal != null) m[fkOnTarget] = sourceIdVal
                                // If relationParam holds the target id (rare for CREATE), put it into a matching column if appropriate
                                val relProvided = mergedParams[relationParam.name]
                                if (relProvided != null) {
                                    // try to place under an 'id' column if target expects it
                                    // This allows client to provide target id directly in relation param,
                                    // even if target table doesn't have a column named exactly as the relation param.
                                    m["id"] = relProvided
                                }
                                paramsForAction = m.toMap()
                            }

                            // For MANY_TO_ONE or ONE_TO_ONE, we assume the FK is on the source table pointing to target.
                            Cardinality.MANY_TO_ONE, Cardinality.ONE_TO_ONE -> {
                                // Usually target is a parent; when relation param present, set the FK on source to target id.
                                // Operate on sourceDef, but ensure FK '<target>_id' is set from the relation param.
                                val fkOnSource = "${targetDef.name}_id"
                                val m = mergedParams.toMutableMap()
                                val targetVal = mergedParams[relationParam.name]
                                if (targetVal != null) m[fkOnSource] = targetVal
                                paramsForAction = m.filterValues { true }
                                objectDefForAction = sourceDef
                                moduleForAction = sourceModule
                            }
                        }
                    } else {
                        // No matching declared relation on sourceDef: fall back to default behavior
                        // fallback state if provided but not found
                        log.warn("No declared relation from ${sourceDef.name} to ${targetDef.name} found; using default target")
                    }
                } else {
                    log.warn("Relation target file not found: ${relFile.absolutePath}; using default target")
                }
            }

            val genericForAction = GenericTableLayer(
                objectDefForAction,
                moduleDatabaseService = moduleDatabaseService,
                moduleId = moduleForAction
            )

            val returnValue = try {
                // Use paramsForAction (mapped) for DB operations, but we still pass original caller id as moduleId
                action?.execute(id, paramsForAction, genericForAction, decl)
            } catch (e: Exception) {
                log.error("Error executing action $actionType", e)
                if (e is com.homelab.core.exception.ApiException) {
                    mapOf("error" to e.message, "errorCode" to e.code)
                } else {
                    mapOf("error" to e.message)
                }
            }

            actionReturn[actionType] = returnValue
        }
        return mapOf("success" to true, "data" to actionReturn)
    }
}