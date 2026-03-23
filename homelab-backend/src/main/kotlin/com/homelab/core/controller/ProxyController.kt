package com.homelab.core.controller

import com.homelab.core.service.ModuleService
import jakarta.servlet.http.HttpServletRequest
import org.springframework.http.HttpEntity
import org.springframework.http.HttpHeaders
import org.springframework.http.HttpMethod
import org.springframework.http.ResponseEntity
import org.springframework.web.bind.annotation.*
import org.springframework.web.client.RestTemplate

@RestController
@RequestMapping("/proxy")
@CrossOrigin(origins = ["*"])
class ProxyController(private val moduleService: ModuleService) {

    private val restTemplate = RestTemplate()

    @RequestMapping("/{moduleId}/**")
    fun proxyRequest(
            @PathVariable moduleId: String,
            @RequestBody(required = false) body: ByteArray?,
            method: HttpMethod,
            request: HttpServletRequest,
            @RequestHeader headers: HttpHeaders
    ): ResponseEntity<ByteArray> {
        val module = moduleService.getModule(moduleId) ?: return ResponseEntity.notFound().build()

        val path =
                request.getAttribute(
                                org.springframework.web.servlet.HandlerMapping
                                        .PATH_WITHIN_HANDLER_MAPPING_ATTRIBUTE
                        )
                        .toString()
                        .substringAfter("/proxy/$moduleId")

        val targetUri =
                org.springframework.web.util.UriComponentsBuilder.fromHttpUrl(module.internalUrl)
                        .path(path)
                        .query(request.queryString)
                        .build(true)
                        .toUri()

        val proxyHeaders = HttpHeaders()
        headers.forEach { name, values ->
            if (!name.equals("host", ignoreCase = true) &&
                            !name.equals("content-length", ignoreCase = true) &&
                            !name.equals("connection", ignoreCase = true)
            ) {
                proxyHeaders.addAll(name, values)
            }
        }

        val entity = HttpEntity(body, proxyHeaders)

        return try {
            val response = restTemplate.exchange(targetUri, method, entity, ByteArray::class.java)
            val responseHeaders = HttpHeaders()
            response.headers.forEach { name, values ->
                if (!name.equals("transfer-encoding", ignoreCase = true)) {
                    responseHeaders.addAll(name, values)
                }
            }
            // Unsafe => i-frame header bypass
            // TODO: Better header management
            // responseHeaders.remove("X-Frame-Options")
            // responseHeaders.remove("Content-Security-Policy")

            // responseHeaders.add("Content-Security-Policy", "frame-ancestors *")
            // responseHeaders.add("X-Frame-Options", "SAMEORIGIN")

            ResponseEntity.status(response.statusCode).headers(responseHeaders).body(response.body)
        } catch (e: org.springframework.web.client.HttpStatusCodeException) {
            ResponseEntity.status(e.statusCode)
                    .headers(e.responseHeaders)
                    .body(e.responseBodyAsByteArray)
        } catch (e: Exception) {
            println("Proxy error for $targetUri: ${e.message}")
            ResponseEntity.status(502)
                    .body("Bad Gateway: ${e.message} for $targetUri".toByteArray())
        }
    }
}
