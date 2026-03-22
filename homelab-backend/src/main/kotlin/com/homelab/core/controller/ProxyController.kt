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

        val path = request.getAttribute(org.springframework.web.servlet.HandlerMapping.PATH_WITHIN_HANDLER_MAPPING_ATTRIBUTE)
                        .toString()
                        .substringAfter("/proxy/$moduleId")

        val targetUri = org.springframework.web.util.UriComponentsBuilder.fromHttpUrl(module.internalUrl)
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
            restTemplate.exchange(targetUri, method, entity, ByteArray::class.java)
        } catch (e: Exception) {
            ResponseEntity.status(502).body("Bad Gateway".toByteArray())
        }
    }
}
