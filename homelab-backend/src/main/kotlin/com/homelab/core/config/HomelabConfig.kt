package com.homelab.core.config

import org.springframework.stereotype.Component
import jakarta.annotation.PostConstruct

@Component
class HomelabConfig {
    var appRoot: String = ".."
    var modulesScanPath: String = ".."

    @PostConstruct
    fun init() {
        appRoot = System.getenv("HOMELAB_APP_ROOT") ?: ".."
        modulesScanPath = System.getenv("HOMELAB_MODULES_SCAN_PATH") ?: ".."
        println("HomelabConfig initialized: appRoot=$appRoot, modulesScanPath=$modulesScanPath")
    }
}
