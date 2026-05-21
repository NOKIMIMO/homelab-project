package com.homelab.core.config

import org.springframework.stereotype.Component
import jakarta.annotation.PostConstruct
import org.springframework.core.env.Environment

@Component
class HomelabConfig(private val env: Environment) {
    var appRoot: String = ".."
    var modulesScanPath: String = ".."
    var pluginsScanPath: String = "plugins"

    @PostConstruct
    fun init() {
        appRoot = env.getProperty("HOMELAB_APP_ROOT", "..")
        modulesScanPath = env.getProperty("HOMELAB_MODULES_SCAN_PATH", "..")
        pluginsScanPath = env.getProperty("HOMELAB_PLUGINS_SCAN_PATH", "plugins")
        println("HomelabConfig initialized: appRoot=$appRoot, modulesScanPath=$modulesScanPath")
    }
}