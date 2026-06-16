package com.homelab.core.model.action

import com.fasterxml.jackson.module.kotlin.jacksonObjectMapper
import com.fasterxml.jackson.module.kotlin.readValue
import com.homelab.core.service.GlobalParametersService
import com.homelab.sdk.action.Action
import com.homelab.sdk.data.GenericTableLayer
import com.homelab.sdk.helper.AppLogger
import com.homelab.sdk.module.action.ModuleActionDeclaration
import java.net.URI
import java.net.URLEncoder
import java.net.http.HttpClient
import java.net.http.HttpRequest
import java.net.http.HttpResponse

class FetchExternalAction(private val globalParametersService: GlobalParametersService) : Action {

    private val log = AppLogger.loggerFor(FetchExternalAction::class)
    private val mapper = jacksonObjectMapper()
    private val httpClient = HttpClient.newHttpClient()

    override fun execute(
        moduleId: String,
        mergedParams: Map<String, Any>,
        genericObject: GenericTableLayer,
        declaration: ModuleActionDeclaration
    ): Any? {
        val city = mergedParams["city"] as? String
            ?: return mapOf("error" to "Paramètre 'city' manquant")

        val baseUrl = globalParametersService.getParam(moduleId, "baseUrl")
            ?: return mapOf("error" to "Paramètre 'baseUrl' non configuré (ouvrir les paramètres du module)")
        val apiKey = globalParametersService.getParam(moduleId, "apiKey")
            ?: return mapOf("error" to "Paramètre 'apiKey' non configuré (ouvrir les paramètres du module)")
        val units = globalParametersService.getParam(moduleId, "units") ?: "metric"

        val encodedCity = URLEncoder.encode(city, "UTF-8")
        val url = "$baseUrl?q=$encodedCity&appid=$apiKey&units=$units"
        log.info("[$moduleId] Fetching external data for city='$city'")

        return try {
            val request = HttpRequest.newBuilder()
                .uri(URI.create(url))
                .GET()
                .build()
            val response = httpClient.send(request, HttpResponse.BodyHandlers.ofString())

            if (response.statusCode() != 200) {
                log.warn("[$moduleId] API returned HTTP ${response.statusCode()} for city='$city'")
                val errorBody = runCatching {
                    mapper.readValue<Map<String, Any>>(response.body())
                }.getOrNull()
                val message = errorBody?.get("message") as? String ?: "HTTP ${response.statusCode()}"
                return mapOf("error" to message, "city" to city)
            }

            val json = mapper.readValue<Map<String, Any>>(response.body())
            val weatherRecord = parseWeatherResponse(json)
            val apiCityName = weatherRecord["city"] as? String ?: city

            // Upsert: update existing row or create a new one
            val updateMap = weatherRecord.filterKeys { it != "city" }
            val rowsUpdated = genericObject.updateByFilters(mapOf("city" to apiCityName), updateMap)
            if (rowsUpdated == 0) {
                genericObject.create(weatherRecord)
            }

            weatherRecord
        } catch (e: Exception) {
            log.error("[$moduleId] Failed to fetch data for city='$city': ${e.message}", e)
            mapOf("error" to (e.message ?: "Erreur inconnue"), "city" to city)
        }
    }

    @Suppress("UNCHECKED_CAST")
    private fun parseWeatherResponse(json: Map<String, Any>): Map<String, Any?> {
        val main = json["main"] as? Map<String, Any> ?: emptyMap()
        val weatherList = json["weather"] as? List<Map<String, Any>> ?: emptyList()
        val wind = json["wind"] as? Map<String, Any> ?: emptyMap()
        val sys = json["sys"] as? Map<String, Any> ?: emptyMap()
        val firstWeather = weatherList.firstOrNull() ?: emptyMap()

        return mapOf(
            "city"        to (json["name"] as? String ?: ""),
            "temperature" to (main["temp"]?.toString() ?: ""),
            "feels_like"  to (main["feels_like"]?.toString() ?: ""),
            "description" to (firstWeather["description"] as? String ?: ""),
            "humidity"    to (main["humidity"]?.toString() ?: ""),
            "wind_speed"  to (wind["speed"]?.toString() ?: ""),
            "icon_code"   to (firstWeather["icon"] as? String ?: ""),
            "country"     to (sys["country"] as? String ?: "")
        )
    }
}
