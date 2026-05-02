package com.homelab.core.config

import com.homelab.core.service.JwtService
import jakarta.servlet.FilterChain
import jakarta.servlet.http.HttpServletRequest
import jakarta.servlet.http.HttpServletResponse
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken
import org.springframework.security.core.context.SecurityContextHolder
import org.springframework.security.web.authentication.WebAuthenticationDetailsSource
import org.springframework.stereotype.Component
import org.springframework.web.filter.OncePerRequestFilter

@Component
class JwtAuthenticationFilter(private val jwtService: JwtService) : OncePerRequestFilter() {

    override fun doFilterInternal(
            request: HttpServletRequest,
            response: HttpServletResponse,
            filterChain: FilterChain
    ) {
        val requestUri = request.requestURI

        var token =
                request.getHeader("Authorization")?.let {
                    if (it.startsWith("Bearer ")) {
                        val t = it.substring(7)
                        // println("Token found in Authorization header for $requestUri")
                        t
                    } else null
                }

        if (token == null) {
            token =
                    request.getParameter("token")?.let {
                        // println("Token found in query parameter for $requestUri")
                        it
                    }
        }

        if (token == null) {
            token =
                    request.cookies?.find { it.name == "homelab_token" }?.value?.let {
                        // println("Token found in cookie for $requestUri")
                        it
                    }
        }

        if (token == null) {
            if (requestUri.startsWith("/api/proxy/") && !requestUri.contains("/assets/")) {
                // println("No token found for proxy request: $requestUri")
            }
            filterChain.doFilter(request, response)
            return
        }

        val username = jwtService.validateToken(token)

        if (username != null && SecurityContextHolder.getContext().authentication == null) {
            val authToken = UsernamePasswordAuthenticationToken(username, null, emptyList())
            authToken.details = WebAuthenticationDetailsSource().buildDetails(request)
            SecurityContextHolder.getContext().authentication = authToken
        } else if (username == null && requestUri.startsWith("/api/proxy/")) {
            println("Invalid/Expired token for: $requestUri")
        }

        filterChain.doFilter(request, response)
    }
}
