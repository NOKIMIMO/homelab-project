package com.homelab.core.exception

class NotFoundException(message: String? = null, cause: Throwable? = null) : ApiException("NOT_FOUND", message, cause)
