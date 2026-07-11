package com.homelab.core.model.action

import java.net.URI
import java.net.http.HttpRequest

object HttpRequestHelper {
    fun build(url: String, method: String?): HttpRequest {
        val m = method?.trim()?.uppercase()?.ifBlank { null } ?: "GET"
        val builder = HttpRequest.newBuilder().uri(URI.create(url))
        return when (m) {
            "GET" -> builder.GET()
            "DELETE" -> builder.DELETE()
            "POST" -> builder.POST(HttpRequest.BodyPublishers.noBody())
            "PUT" -> builder.PUT(HttpRequest.BodyPublishers.noBody())
            else -> builder.method(m, HttpRequest.BodyPublishers.noBody())
        }.build()
    }
}
