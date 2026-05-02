package com.homelab.core.config

import org.springframework.context.annotation.Bean
import org.springframework.context.annotation.Configuration
import org.springframework.security.config.annotation.web.builders.HttpSecurity
import org.springframework.security.config.annotation.web.configuration.EnableWebSecurity
import org.springframework.security.web.SecurityFilterChain
import org.springframework.web.cors.CorsConfiguration
import org.springframework.web.cors.CorsConfigurationSource
import org.springframework.web.cors.UrlBasedCorsConfigurationSource

@Configuration
@EnableWebSecurity
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
                    auth.requestMatchers("/proxy/**").permitAll()
                    auth.requestMatchers("/api/proxy/**").permitAll()
                    auth.requestMatchers("/api/modules/**").authenticated()
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
}
