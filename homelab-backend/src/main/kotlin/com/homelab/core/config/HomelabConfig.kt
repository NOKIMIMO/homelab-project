package com.homelab.core.config

import com.homelab.sdk.helper.AppLogger
import com.homelab.core.service.AppletService
import org.springframework.stereotype.Component
import jakarta.annotation.PostConstruct
import org.springframework.core.env.Environment

@Component
class HomelabConfig(private val env: Environment) {
    var appRoot: String = ".."
    var modulesScanPath: String = ".."
    var pluginsScanPath: String = "plugins"
    // Root directory for files the app itself writes (module uploads, app icon, ...), as opposed
    // to appRoot/modulesScanPath which are read-only inputs. Must point at a mounted volume in
    // Docker (see docker-compose*.yml) - a bare relative path resolves against the JVM's cwd,
    // which is the container's writable layer and is wiped on every recreate, not just restart.
    var storagePath: String = "storage"
    private val log = AppLogger.loggerFor(HomelabConfig::class)

    @PostConstruct
    fun init() {
        appRoot = env.getProperty("HOMELAB_APP_ROOT", "..")
        modulesScanPath = env.getProperty("HOMELAB_MODULES_SCAN_PATH", "..")
        pluginsScanPath = env.getProperty("HOMELAB_PLUGINS_SCAN_PATH", "plugins")
        storagePath = env.getProperty("HOMELAB_STORAGE_PATH", "storage")
        log.debug("HomelabConfig initialized: appRoot=$appRoot, modulesScanPath=$modulesScanPath, pluginsScanPath=$pluginsScanPath, storagePath=$storagePath")
    }
}