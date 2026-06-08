package com.homelab.core.service

import com.homelab.core.config.HomelabConfig
import com.homelab.core.model.action.*
import com.homelab.sdk.module.action.ModuleActionDeclaration
import com.homelab.core.action.ActionFactory
import com.homelab.core.parser.ModuleDataObjectParser
import com.homelab.core.service.module.ModuleDatabaseService
import com.homelab.sdk.action.Action
import com.homelab.sdk.data.GenericTableLayer
import org.springframework.stereotype.Service
import java.io.File

@Service
class AppletService(
    private val moduleDatabaseService: ModuleDatabaseService,
    private val homelabConfig: HomelabConfig,
    private val actionFactory: ActionFactory
) {

    fun invokeFunctionOfModule(
        id: String,
        mergedParams: Map<String, Any>,
        decl: ModuleActionDeclaration,
        resolvedLogic: List<Map<String, Any>>): Map<String, Any?>{
        val errorList = mutableListOf<String>()

        //param validation
        for (declaredParam in decl.parameters) {
            if(declaredParam.name !in mergedParams){
                errorList.add("Missing parameter ${declaredParam.name}")
            }
        }
        if (errorList.isNotEmpty()){
            return mapOf("success" to false, "errors" to errorList)
        }
        // logic validation
        val resolvedObject = decl.actUponObject.let { obj ->
            val file = File(
                homelabConfig.modulesScanPath,
                "$id/$obj"
            ).canonicalFile
            if (!file.exists()) {
                error("Data object XML not found: ${file.absolutePath}")
            }
            val xml = file.readText()
            ModuleDataObjectParser.parseFromXml(xml)
        }
        println("Resolved object: $resolvedObject")

        val genericObject = GenericTableLayer(
            resolvedObject,
            moduleDatabaseService = moduleDatabaseService,
            moduleId = id
        )

        val actionReturn = mutableMapOf<String, Any?>()
        for (actionDecl in resolvedLogic) {
            val actionType = actionDecl["type"] as String

            val action: Action? = actionFactory.resolve(actionType)

            println("Resolved action: $action")

            val returnValue = try {
                action?.execute(id, mergedParams, genericObject, decl)
            } catch (e: Exception) {
                println("Action $actionType threw: ${e.message}")
                mapOf("error" to e.message)
            }

            actionReturn[actionType] = returnValue
        }
        return mapOf("success" to true, "data" to actionReturn)
    }
}