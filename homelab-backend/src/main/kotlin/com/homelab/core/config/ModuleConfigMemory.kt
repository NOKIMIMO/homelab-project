package com.homelab.core.config
import com.homelab.core.model.module.ModuleConfig
import org.springframework.stereotype.Component
import java.io.File
import java.util.concurrent.ConcurrentHashMap

@Component
class ModuleConfigMemory {

    private val configs = ConcurrentHashMap<String, ModuleConfig>()
    private val directories = ConcurrentHashMap<String, File>()

    fun put(moduleId: String, config: ModuleConfig, directory: File) {
        configs[moduleId] = config
        directories[moduleId] = directory
    }

    fun getConfig(moduleId: String): ModuleConfig? =
        configs[moduleId]

    fun getDirectory(moduleId: String): File? =
        directories[moduleId]

    fun getAllConfigs(): List<ModuleConfig> =
        configs.values.toList()

    fun contains(moduleId: String): Boolean =
        configs.containsKey(moduleId)

    fun remove(moduleId: String) {
        configs.remove(moduleId)
        directories.remove(moduleId)
    }

    fun clear() {
        configs.clear()
        directories.clear()
    }
}