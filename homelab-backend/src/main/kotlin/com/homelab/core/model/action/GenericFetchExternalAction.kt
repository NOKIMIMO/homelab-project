package com.homelab.core.model.action

import com.fasterxml.jackson.module.kotlin.jacksonObjectMapper
import com.fasterxml.jackson.module.kotlin.readValue
import com.homelab.core.service.GlobalParametersService
import com.homelab.sdk.action.Action
import com.homelab.sdk.data.GenericTableLayer
import com.homelab.sdk.helper.AppLogger
import com.homelab.sdk.module.action.ModuleActionDeclaration
import java.net.URLEncoder
import java.net.http.HttpClient
import java.net.http.HttpResponse

/**
 * Declarative counterpart to [FetchExternalAction]: instead of hardcoded per-module parsing,
 * the request URL and the JSON->column mapping are read from this function's own
 * `logic[].params` entry in the manifest, so a module builder can generate FETCH_EXTERNAL-style
 * routes for arbitrary external APIs without writing Kotlin. Configuration:
 * - `urlTemplate`: string with `{name}` placeholders, resolved from the call's params first,
 *   then from this module's params.json values (eg. an `{apiKey}` stored as a secret param).
 * - `method` (optional): HTTP method, defaults to GET.
 * - `responseMapping` (optional): target column name -> dotted JSON path into the response body
 *   (supports `field[index]` for arrays, eg. `weather[0].description`). When absent, this action
 *   runs in raw-passthrough mode: fetch + parse only, returning the JSON body as-is without
 *   creating a row, so a following logic step (eg. MAP_JSON) can consume it via `_previousResult`.
 * - `upsertKey` (optional): column name used to update-or-create instead of always inserting.
 */
class GenericFetchExternalAction(private val globalParametersService: GlobalParametersService) : Action {

    private val log = AppLogger.loggerFor(GenericFetchExternalAction::class)
    private val mapper = jacksonObjectMapper()
    private val httpClient = HttpClient.newHttpClient()

    @Suppress("UNCHECKED_CAST")
    override fun execute(
        moduleId: String,
        mergedParams: Map<String, Any>,
        genericObject: GenericTableLayer,
        declaration: ModuleActionDeclaration
    ): Any? {
        val config = declaration.logic.firstOrNull { it.type == "FETCH_EXTERNAL_GENERIC" }?.params
            ?: return mapOf("error" to "Configuration FETCH_EXTERNAL_GENERIC manquante")

        val urlTemplate = config["urlTemplate"] as? String
            ?: return mapOf("error" to "'urlTemplate' non configuré")

        // Absent responseMapping ⇒ raw-passthrough mode: fetch + parse only, return the body as-is
        // without creating a row, so a following MAP_JSON step can map it via `_previousResult`.
        val responseMapping = config["responseMapping"] as? Map<String, String>

        val upsertKey = config["upsertKey"] as? String
        val method = config["method"] as? String

        val moduleParams = globalParametersService.getAllParams(moduleId)

        val url = urlTemplate.replace(Regex("\\{(\\w+)}")) { match ->
            val key = match.groupValues[1]
            val raw = mergedParams[key]?.toString() ?: moduleParams[key] ?: ""
            URLEncoder.encode(raw, "UTF-8")
        }

        log.info("[$moduleId] Fetching external data for function '${declaration.name}'")

        return try {
            val request = HttpRequestHelper.build(url, method)
            val response = httpClient.send(request, HttpResponse.BodyHandlers.ofString())

            if (response.statusCode() != 200) {
                val errorBody = runCatching { mapper.readValue<Map<String, Any>>(response.body()) }.getOrNull()
                val message = errorBody?.get("message") as? String ?: "HTTP ${response.statusCode()}"
                return mapOf("error" to message)
            }

            val json = mapper.readValue<Map<String, Any>>(response.body())
            if (responseMapping == null) {
                return json
            }

            val record: Map<String, String?> = responseMapping.mapValues { (_, path) -> JsonPathResolver.resolve(json, path)?.toString() }

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
            record
        } catch (e: Exception) {
            log.error("[$moduleId] External fetch failed for function '${declaration.name}': ${e.message}", e)
            mapOf("error" to (e.message ?: "Erreur inconnue"))
        }
    }
}
