package com.homelab.core.plugin

import com.homelab.core.config.HomelabConfig
import com.homelab.core.model.action.Action
import org.springframework.stereotype.Service
import java.io.File
import java.net.URLClassLoader
import java.util.ServiceLoader
import java.util.concurrent.ConcurrentHashMap
import jakarta.annotation.PostConstruct

@Service
class PluginRegistry(private val homelabConfig: HomelabConfig) {
    private val registry = ConcurrentHashMap<String, Action>()

    fun hasType(name: String): Boolean = registry.containsKey(name)

    fun getAction(name: String): Action? = registry[name]

    fun register(typeName: String, action: Action): Boolean {
        val prev = registry.putIfAbsent(typeName, action)
        return prev == null
    }

    @PostConstruct
    fun loadPlugins() {
        val path = homelabConfig.pluginsScanPath
        if (path.isBlank()) return
        val dir = File(path).canonicalFile
        if (!dir.exists() || !dir.isDirectory) {
            println("Plugin directory not found: ${dir.absolutePath}")
            return
        }
        val jars = dir.listFiles { f: File -> f.isFile && f.name.endsWith(".jar") } ?: return
        for (jar in jars) {
            try {
                val url = jar.toURI().toURL()
                val cl = URLClassLoader(arrayOf(url), this::class.java.classLoader)
                val loader = ServiceLoader.load(LogicPlugin::class.java, cl)
                for (plugin in loader) {
                    try {
                        val type = plugin.typeName()
                        val action = plugin.actionSingleton()
                        if (registry.containsKey(type)) {
                            println("Plugin type '$type' from '${jar.name}' conflicts with existing type. Skipping.")
                            continue
                        }
                        registry[type] = action
                        println("Loaded plugin type '$type' from '${jar.name}'")
                    } catch (e: Exception) {
                        println("Failed to register plugin from ${jar.name}: ${e.message}")
                    }
                }
                // no-op when no ServiceLoader entries
            } catch (e: Exception) {
                println("Failed to load plugin jar ${jar.absolutePath}: ${e.message}")
            }
        }
    }

    fun ensureLoaded() {
        if (registry.isEmpty()) loadPlugins()
    }
}



