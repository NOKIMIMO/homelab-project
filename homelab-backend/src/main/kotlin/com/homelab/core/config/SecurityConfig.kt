package com.homelab.core.config

import jakarta.servlet.http.HttpServletResponse
import org.springframework.context.annotation.Bean
import org.springframework.context.annotation.Configuration
import org.springframework.security.config.annotation.web.builders.HttpSecurity
import org.springframework.security.config.annotation.web.configuration.EnableWebSecurity
import org.springframework.security.web.AuthenticationEntryPoint
import org.springframework.security.web.SecurityFilterChain
import org.springframework.security.web.access.AccessDeniedHandler
import org.springframework.web.cors.CorsConfiguration
import org.springframework.web.cors.CorsConfigurationSource
import org.springframework.web.cors.UrlBasedCorsConfigurationSource
import org.slf4j.LoggerFactory
import org.springframework.web.filter.ForwardedHeaderFilter
import org.springframework.boot.web.servlet.FilterRegistrationBean
import org.springframework.security.config.annotation.method.configuration.EnableMethodSecurity

@Configuration
@EnableWebSecurity
@EnableMethodSecurity
class SecurityConfig {

    @Bean
    fun securityFilterChain(
            http: HttpSecurity,
            jwtFilter: JwtAuthenticationFilter
    ): SecurityFilterChain {
        http
                .csrf { it.disable() }
                .cors { it.configurationSource(corsConfigurationSource()) }
                .authorizeHttpRequests { auth ->
                    auth.requestMatchers("/").permitAll()
                    auth.requestMatchers("/api/auth/**").permitAll()
                    auth.requestMatchers("/error").permitAll() // for 404 and other
                    // Allow public access to module icons and UI assets
                    auth.requestMatchers("/api/modules/*/UI/icon").permitAll()
                    auth.requestMatchers("/api/admin/**").hasRole("ADMIN")
                    auth.requestMatchers("/api/**").authenticated()
                    auth.anyRequest().authenticated()
                }
                .sessionManagement {
                    it.sessionCreationPolicy(
                            org.springframework.security.config.http.SessionCreationPolicy.STATELESS
                    )
                }
                .addFilterBefore(
                        jwtFilter,
                        org.springframework.security.web.authentication
                                        .UsernamePasswordAuthenticationFilter::class
                                .java
                )
                .exceptionHandling {
                    it.authenticationEntryPoint(authenticationEntryPoint())
                    it.accessDeniedHandler(accessDeniedHandler())
                }
                .headers { it.frameOptions { fo -> fo.disable() } }
//                .httpBasic { it.disable() } // comment to allow simple
                .formLogin { it.disable() }

        return http.build()
    }

    @Bean
    fun corsConfigurationSource(): CorsConfigurationSource {
        val configuration = CorsConfiguration()
        configuration.allowedOrigins = listOf("*")
        configuration.allowedMethods = listOf("GET", "POST", "PUT", "DELETE", "OPTIONS")
        configuration.allowedHeaders = listOf("*")
        val source = UrlBasedCorsConfigurationSource()
        source.registerCorsConfiguration("/**", configuration)
        return source
    }

    @Bean
    fun authenticationEntryPoint(): AuthenticationEntryPoint {
        return AuthenticationEntryPoint { request, response, authException ->
            logger.warn("Unauthorized access to: ${request.requestURI}")
            response.sendError(HttpServletResponse.SC_UNAUTHORIZED, "Unauthorized")
        }
    }

    @Bean
    fun accessDeniedHandler(): AccessDeniedHandler {
        return AccessDeniedHandler { request, response, accessDeniedException ->
            logger.warn("Access denied to: ${request.requestURI}")
            response.sendError(HttpServletResponse.SC_FORBIDDEN, "Forbidden")
        }
    }

    // Support X-Forwarded-* headers when behind a reverse proxy so generated absolute URLs use original host/scheme
    @Bean
    fun forwardedHeaderFilter(): FilterRegistrationBean<ForwardedHeaderFilter> {
        val bean = FilterRegistrationBean(ForwardedHeaderFilter())
        bean.order = 0
        return bean
    }
    private val logger = LoggerFactory.getLogger(SecurityConfig::class.java)
}
