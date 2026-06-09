package com.homelab.core.exception

class PersistenceException(message: String? = null, cause: Throwable? = null) : ApiException("PERSISTENCE_ERROR", message, cause)
