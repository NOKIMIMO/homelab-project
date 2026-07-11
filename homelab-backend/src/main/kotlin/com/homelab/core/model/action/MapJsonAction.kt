package com.homelab.core.model.action

import com.fasterxml.jackson.module.kotlin.jacksonObjectMapper
import com.fasterxml.jackson.module.kotlin.readValue
import com.homelab.core.config.HomelabConfig
import com.homelab.sdk.action.Action
import com.homelab.sdk.data.GenericTableLayer
import com.homelab.sdk.helper.AppLogger
import com.homelab.sdk.module.action.ModuleActionDeclaration
import java.io.File

/**
 * Maps the previous logic step's result (`_previousResult`, see [AppletService][com.homelab.core.service.AppletService])
 * into table columns using a dedicated mapping file, `<moduleId>/<functionName>.mapping.json`,
 * shaped `{"responseMapping": {"col": "json.path"}, "upsertKey": "col"}` — same semantics as
 * [GenericFetchExternalAction]'s inline `responseMapping`/`upsertKey`, just externalized so a
 * fetch-only step (raw-passthrough mode) can be chained into this one.
 */
class MapJsonAction(private val homelabConfig: HomelabConfig) : Action {

    private val log = AppLogger.loggerFor(MapJsonAction::class)
    private val mapper = jacksonObjectMapper()

    @Suppress("UNCHECKED_CAST")
    override fun execute(
        moduleId: String,
        mergedParams: Map<String, Any>,
        genericObject: GenericTableLayer,
        declaration: ModuleActionDeclaration
    ): Any? {
        val source = mergedParams["_previousResult"] as? Map<*, *>
            ?: return mapOf("error" to "MAP_JSON needs a previous step's result to map")

        val mappingFile = File(homelabConfig.modulesScanPath, "$moduleId/${declaration.name}.mapping.json")
        if (!mappingFile.exists()) {
            return mapOf("error" to "Mapping file not found: ${mappingFile.name}")
        }

        val config = try {
            mapper.readValue<Map<String, Any>>(mappingFile.readText())
        } catch (e: Exception) {
            log.error("[$moduleId] Failed to read mapping file '${mappingFile.name}': ${e.message}", e)
            return mapOf("error" to "Invalid mapping file '${mappingFile.name}': ${e.message}")
        }

        val responseMapping = config["responseMapping"] as? Map<String, String>
            ?: return mapOf("error" to "'responseMapping' missing in ${mappingFile.name}")
        val upsertKey = config["upsertKey"] as? String

        val record: Map<String, String?> = responseMapping.mapValues { (_, path) -> JsonPathResolver.resolve(source, path)?.toString() }

        if (upsertKey != null) {
            val keyValue = record[upsertKey]
            if (keyValue != null) {
                val updateMap = record.filterKeys { it != upsertKey }
                val rowsUpdated = genericObject.updateByFilters(mapOf(upsertKey to keyValue), updateMap)
                if (rowsUpdated == 0) genericObject.create(record)
                return record
            }
        }

        genericObject.create(record)
        return record
    }
}
