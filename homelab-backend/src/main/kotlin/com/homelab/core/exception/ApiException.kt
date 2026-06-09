package com.homelab.core.exception

/**
 * Base exception for API-level errors. Subclasses carry a machine-readable code.
 */
open class ApiException(
    val code: String,
    message: String? = null,
    cause: Throwable? = null
) : RuntimeException(message, cause)