package com.homelab.core.model.action

import java.net.URI
import java.net.http.HttpRequest

/** Shared by [FetchExternalAction] and [GenericFetchExternalAction]: builds a request for an
 * arbitrary HTTP method, defaulting to GET when none is configured (so manifests written before
 * `method` existed keep working unchanged). */
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
