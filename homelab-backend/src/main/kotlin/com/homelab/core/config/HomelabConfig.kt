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
    private val log = AppLogger.loggerFor(HomelabConfig::class)

    @PostConstruct
    fun init() {
        appRoot = env.getProperty("HOMELAB_APP_ROOT", "..")
        modulesScanPath = env.getProperty("HOMELAB_MODULES_SCAN_PATH", "..")
        pluginsScanPath = env.getProperty("HOMELAB_PLUGINS_SCAN_PATH", "plugins")
        log.debug("HomelabConfig initialized: appRoot=$appRoot, modulesScanPath=$modulesScanPath, pluginsScanPath=$pluginsScanPath")
    }
}