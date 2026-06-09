package com.homelab.core.exception

class ForbiddenException(message: String? = null, cause: Throwable? = null) : ApiException("FORBIDDEN", message, cause)
