package com.homelab.core.controller

import com.homelab.core.service.ModuleService
import jakarta.servlet.http.HttpServletRequest
import org.springframework.core.io.ByteArrayResource
import org.springframework.http.HttpEntity
import org.springframework.http.HttpHeaders
import org.springframework.http.HttpMethod
import org.springframework.http.ResponseEntity
import org.springframework.util.LinkedMultiValueMap
import org.springframework.util.MultiValueMap
import org.springframework.web.bind.annotation.*
import org.springframework.web.client.RestTemplate
import org.springframework.web.multipart.MultipartHttpServletRequest

@RestController
@RequestMapping("/api/proxy")
@CrossOrigin(origins = ["*"])
class ProxyController(private val moduleService: ModuleService) {

    private val restTemplate = RestTemplate()

    @RequestMapping("/{moduleId}/**")
    fun proxyRequest(
            @PathVariable moduleId: String,
            request: HttpServletRequest,
            method: HttpMethod,
            @RequestHeader headers: HttpHeaders
    ): ResponseEntity<ByteArray> {
        val module = moduleService.getModule(moduleId) ?: return ResponseEntity.notFound().build()

        val path =
                request.getAttribute(
                                org.springframework.web.servlet.HandlerMapping
                                        .PATH_WITHIN_HANDLER_MAPPING_ATTRIBUTE
                        )
                        .toString()
                        .substringAfter("/api/proxy/$moduleId")

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
                            !name.equals("connection", ignoreCase = true) &&
                            // Remove content-type for multipart as RestTemplate will generate it with new boundary
                            !(request is MultipartHttpServletRequest && name.equals("content-type", ignoreCase = true))
            ) {
                proxyHeaders.addAll(name, values)
            }
        }

        val body: Any? = if (request is MultipartHttpServletRequest) {
            val map = LinkedMultiValueMap<String, Any>()
            request.parameterMap.forEach { (name, values) ->
                values.forEach { map.add(name, it) }
            }
            request.fileMap.forEach { (name, file) ->
                val resource = object : ByteArrayResource(file.bytes) {
                    override fun getFilename(): String? = file.originalFilename
                }
                map.add(name, resource)
            }
            map
        } else if (method == HttpMethod.POST || method == HttpMethod.PUT) {
            val bytes = request.inputStream.readAllBytes()
            if (bytes.isEmpty()) null else bytes
        } else {
            null
        }

        val entity = HttpEntity(body, proxyHeaders)
        
        println("Proxying ${method.name()} request to $targetUri (isMultipart: ${request is MultipartHttpServletRequest})")

        return try {
            val response = restTemplate.exchange(targetUri, method, entity, ByteArray::class.java)
            val responseHeaders = HttpHeaders()
            response.headers.forEach { name, values ->
                if (!name.equals("transfer-encoding", ignoreCase = true) &&
                    !name.equals("x-frame-options", ignoreCase = true) &&
                    !name.equals("content-security-policy", ignoreCase = true)
                ) {
                    responseHeaders.addAll(name, values)
                }
            }
            
            ResponseEntity.status(response.statusCode).headers(responseHeaders).body(response.body)
        } catch (e: org.springframework.web.client.HttpStatusCodeException) {
            println("Proxy response error from $targetUri: ${e.statusCode} ${e.responseBodyAsString}")
            ResponseEntity.status(e.statusCode)
                    .headers(e.responseHeaders)
                    .body(e.responseBodyAsByteArray)
        } catch (e: Exception) {
            println("Internal Proxy error for $targetUri: ${e.message}")
            e.printStackTrace()
            ResponseEntity.status(500)
                    .body("Internal Proxy Error: ${e.message} for $targetUri".toByteArray())
        }
    }
}
