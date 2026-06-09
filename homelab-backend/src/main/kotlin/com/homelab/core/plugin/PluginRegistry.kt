package com.homelab.core.plugin

import com.homelab.core.config.HomelabConfig
import com.homelab.core.helper.AppLogger
import com.homelab.core.service.AppletService
import com.homelab.sdk.module.action.ModuleActionDeclaration
import com.homelab.sdk.module.action.ModuleActionParameterType
import com.homelab.sdk.filter.FilterSpec
import com.homelab.sdk.action.Action as SdkAction
import com.homelab.sdk.context.PluginContext
import com.homelab.sdk.data.GenericTableLayer
import com.homelab.sdk.plugin.LogicPlugin
import org.springframework.stereotype.Service
import java.io.File
import java.net.URLClassLoader
import java.util.ServiceLoader
import java.util.concurrent.ConcurrentHashMap
import jakarta.annotation.PostConstruct

@Service
class PluginRegistry(private val homelabConfig: HomelabConfig) {
    private val log = AppLogger.loggerFor(AppletService::class)

    private val registry = ConcurrentHashMap<String, SdkAction>()

    fun hasType(name: String): Boolean = registry.containsKey(name)

    fun getAction(name: String): SdkAction? = registry[name]

    fun register(typeName: String, action: SdkAction): Boolean {
        val prev = registry.putIfAbsent(typeName, action)
        return prev == null
    }

    @PostConstruct
    fun loadPlugins() {
        //println("[PluginRegistry] Scanning plugins...")
        val path = homelabConfig.pluginsScanPath
        if (path.isBlank()) return
        val dir = File(path).canonicalFile
        if (!dir.exists() || !dir.isDirectory) {
            log.debug("Plugin directory not found: ${dir.absolutePath}, creating")
            dir.mkdirs()
        }
        val jars = dir.listFiles { f: File -> f.isFile && f.name.endsWith(".jar") } ?: return
        //println("[PluginRegistry] Found ${jars.size} plugin jars")
        for (jar in jars) {
            try {
                val url = jar.toURI().toURL()
                //println("[PluginRegistry] Loading plugin from ${jar.name}")
                val cl = URLClassLoader(arrayOf(url), this::class.java.classLoader)
                val loader = ServiceLoader.load(LogicPlugin::class.java, cl)
                log.debug("Found ${loader.count()} plugins in ${jar.name}")
                for (plugin in loader) {
                    try {
                        val type = plugin.typeName()
                        val sdkAction: SdkAction = plugin.actionSingleton()

                        if (registry.containsKey(type)) {
                            log.warn("Plugin type '$type' from '${jar.name}' conflicts with existing type. Skipping.")
                            continue
                        }

                        val wrapped = object : SdkAction {
                            override fun execute(
                                moduleId: String,
                                mergedParams: Map<String, Any>,
                                genericObject: GenericTableLayer,
                                declaration: ModuleActionDeclaration
                            ): Any? {
                                val ctx = object : PluginContext {
                                    override fun moduleId(): String = moduleId

                                    override fun find(filters: List<FilterSpec>): List<Map<String, Any?>> {
                                        val coreFilters = filters.mapNotNull { f ->
                                            if (f.value == null) null else f.column to Pair(f.value, ModuleActionParameterType.EQUAL)
                                        }.toMap()
                                        return genericObject.find(coreFilters)
                                    }

                                    override fun findOne(filters: List<FilterSpec>): Map<String, Any?>? {
                                        return find(filters).firstOrNull()
                                    }

                                    override fun update(
                                        predicate: (Map<String, Any?>) -> Boolean,
                                        updateFunction: (Map<String, Any?>) -> Map<String, Any?>
                                    ): Boolean {
                                        return genericObject.update(predicate, updateFunction)
                                    }

                                    override fun create(item: Map<String, Any?>): Boolean {
                                        return genericObject.create(item)
                                    }

                                    override fun delete(filters: List<FilterSpec>): Int {
                                        val coreFilters = filters.mapNotNull { f ->
                                            if (f.value == null) null else f.column to Pair(f.value, ModuleActionParameterType.EQUAL)
                                        }.toMap()
                                        return genericObject.delete(coreFilters)
                                    }

                                    override fun declaration(): ModuleActionDeclaration = declaration

                                    override fun log(level: String, msg: String) {
                                        log.info("[PLUGIN][$level] $msg")
                                    }
                                }

                                return try {
                                    sdkAction.execute(moduleId, mergedParams, genericObject, declaration)
                                } catch (e: Exception) {
                                    log.error("Plugin action '$type' threw an exception: ${e.message}", e)
                                    null
                                }

                            }
                        }

                        registry[type] = wrapped
                        log.info("Loaded plugin type '$type' from '${jar.name}'")
                    } catch (e: Exception) {
                        log.error("Failed to initialize plugin from ${jar.name}: ${e.message}", e)
                    }
                }
            } catch (e: Exception) {
                log.error("Failed to load plugin jar ${jar.absolutePath}: ${e.message}", e)
            }
        }
    }

    fun ensureLoaded() {
        if (registry.isEmpty()) loadPlugins()
    }

    /**
     * Return a snapshot of registered plugin action type names.
     */
    fun getRegisteredTypes(): List<String> {
        ensureLoaded()
        return registry.keys.toList()
    }
}



