package com.homelab.core.config

import org.springframework.stereotype.Component
import jakarta.annotation.PostConstruct
import org.springframework.core.env.Environment

@Component
class HomelabConfig(private val env: Environment) {
    var appRoot: String = ".."
    var modulesScanPath: String = ".."

    @PostConstruct
    fun init() {
        appRoot = env.getProperty("HOMELAB_APP_ROOT", "..")
        modulesScanPath = env.getProperty("HOMELAB_MODULES_SCAN_PATH", "..")
        println("HomelabConfig initialized: appRoot=$appRoot, modulesScanPath=$modulesScanPath")
    }
}