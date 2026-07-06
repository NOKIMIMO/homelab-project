package com.homelab.core.config

import com.homelab.core.model.auth.UserRepository
import com.homelab.sdk.helper.AppLogger
import com.homelab.core.service.AppletService
import com.homelab.core.service.JwtService
import jakarta.servlet.FilterChain
import jakarta.servlet.http.HttpServletRequest
import jakarta.servlet.http.HttpServletResponse
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken
import org.springframework.security.core.authority.SimpleGrantedAuthority
import org.springframework.security.core.context.SecurityContextHolder
import org.springframework.security.web.authentication.WebAuthenticationDetailsSource
import org.springframework.stereotype.Component
import org.springframework.web.filter.OncePerRequestFilter
@Component
class JwtAuthenticationFilter(
    private val jwtService: JwtService,
    private val userRepository: UserRepository
) : OncePerRequestFilter() {

    override fun doFilterInternal(
        request: HttpServletRequest,
        response: HttpServletResponse,
        filterChain: FilterChain
    ) {
        val token = extractToken(request)

        if (token == null) {
            filterChain.doFilter(request, response)
            return
        }

        val claims = jwtService.validateToken(token)

        if (claims == null) {
            filterChain.doFilter(request, response)
            return
        }

        if (SecurityContextHolder.getContext().authentication == null) {

            val username = claims.subject
            //technically we could just check on the jwt token for admin buuuuuuuuuuut it can be tampered with so NO
            val user = userRepository.findByEmail(username).orElse(null)

            if (user != null) {

                val authorities = if (user.isAdmin) {
                    listOf(SimpleGrantedAuthority("ROLE_ADMIN"))
                } else {
                    emptyList()
                }

                val auth = UsernamePasswordAuthenticationToken(
                    username,
                    null,
                    authorities
                )

                auth.details = WebAuthenticationDetailsSource().buildDetails(request)
                SecurityContextHolder.getContext().authentication = auth
            }
        }

        filterChain.doFilter(request, response)
    }

    private fun extractToken(request: HttpServletRequest): String? {
        val header = request.getHeader("Authorization")
        if (header != null && header.startsWith("Bearer ")) {
            return header.substring(7)
        }

        request.getParameter("token")?.let { return it }

        return request.cookies
            ?.find { it.name == "homelab_token" }
            ?.value
    }
}