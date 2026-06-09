package com.homelab.core.exception

class BadRequestException(message: String? = null, cause: Throwable? = null) : ApiException("BAD_REQUEST", message, cause)
