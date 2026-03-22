package com.homelab.core.service

import com.fasterxml.jackson.databind.ObjectMapper
import com.fasterxml.jackson.module.kotlin.registerKotlinModule
import com.homelab.core.config.HomelabConfig
import com.homelab.core.model.*
import jakarta.annotation.*
import java.io.File
import java.net.*
import java.util.concurrent.ConcurrentHashMap
import java.util.concurrent.TimeUnit
import org.springframework.stereotype.Service

@Service
class ModuleService(private val homelabConfig: HomelabConfig) {
    private val mapper = ObjectMapper().registerKotlinModule()
    private val modules = ConcurrentHashMap<String, Module>()
    private val processes = ConcurrentHashMap<String, Process>()
    private val moduleConfigs = ConcurrentHashMap<String, File>()

    @PostConstruct
    fun init() {
        scanModules()
    }

    @PreDestroy
    fun cleanup() {
        println("Shutting down: stopping all managed modules...")
        try {
            // Stop all containers with the managed label
            val pb =
                    ProcessBuilder(
                            "sh",
                            "-c",
                            "docker ps -q --filter \"label=com.homelab.managed=true\" | xargs -r docker stop"
                    )
            pb.inheritIO()
            val process = pb.start()
            process.waitFor(10, TimeUnit.SECONDS)
            println("Cleanup finished")
        } catch (e: Exception) {
            println("Failed to run global cleanup: ${e.message}")
        }
    }

    fun scanModules() {
        val root = File(homelabConfig.modulesScanPath).canonicalFile
        println("Scanning modules in ${root.absolutePath}")

        val files = root.listFiles()
        if (files != null) {
            files.filter { it.isDirectory }.forEach { dir ->
                val configFile = File(dir, "homelab-module.json")
                if (configFile.exists()) {
                    try {
                        val config = mapper.readValue(configFile, ModuleConfig::class.java)
                        moduleConfigs[config.id] = dir
                        val existing = modules[config.id]
                        if (existing == null) {
                            modules[config.id] =
                                    Module(
                                            id = config.id,
                                            name = config.name,
                                            port = config.port,
                                            internalUrl =
                                                    if (config.type == ModuleType.DOCKER)
                                                            "http://${config.id}:${config.port}"
                                                    else "http://localhost:${config.port}",
                                            status = ModuleStatus.INACTIVE,
                                            icon = config.icon,
                                            description = config.description,
                                            type = config.type
                                    )
                        }
                    } catch (e: Exception) {
                        println("Failed to load module config in ${dir.name}: ${e.message}")
                    }
                }
            }
        }
        println("Modules loaded: ${modules.size}")
        println(modules)
    }

    fun getModules(): List<Module> {
        modules.values.forEach { updateModuleStatus(it) }
        return modules.values.toList()
    }

    private fun updateModuleStatus(module: Module) {
        if (module.type == ModuleType.DOCKER) {
            val isRunning = isContainerRunning(module.id)
            if (isRunning) {
                if (module.status != ModuleStatus.ACTIVE) {
                    module.status = ModuleStatus.ACTIVE
                    module.uptimeStart = System.currentTimeMillis() // Approximate
                }
            } else {
                module.status = ModuleStatus.INACTIVE
                module.uptimeStart = null
            }
            return
        }

        val process = processes[module.id]
        if (process != null && process.isAlive) {
            module.status = ModuleStatus.ACTIVE
        } else if (module.status == ModuleStatus.ACTIVE) {
            module.status = ModuleStatus.INACTIVE
            module.uptimeStart = null
            processes.remove(module.id)
        }
    }

    private fun isContainerRunning(containerName: String): Boolean {
        return try {
            val pb = ProcessBuilder("docker", "compose", "ps", "--format", "json", containerName)
            val moduleDir = moduleConfigs[containerName]
            val useLocalCompose =
                    moduleDir != null && File(moduleDir, "docker-compose.yml").exists()

            pb.directory(if (useLocalCompose) moduleDir else File(homelabConfig.appRoot))
            val process = pb.start()
            val output = process.inputStream.bufferedReader().readText().trim()
            output.contains("\"State\":\"running\"", ignoreCase = true) ||
                    output.contains("running", ignoreCase = true)
        } catch (e: Exception) {
            false
        }
    }

    fun getModule(id: String): Module? {
        val module = modules[id] ?: return null
        updateModuleStatus(module)
        return module
    }

    fun startModule(id: String): Boolean {
        val module = modules[id] ?: return false
        println("Starting module $id")
        if (module.type == ModuleType.DOCKER) {
            println("Starting module $id as docker container")
            return try {
                module.status = ModuleStatus.STARTING
                val pb =
                        ProcessBuilder("docker", "compose", "up", "-d", id)
                                .redirectErrorStream(true)

                val moduleDir = moduleConfigs[id]
                val useLocalCompose =
                        moduleDir != null && File(moduleDir, "docker-compose.yml").exists()
                if (useLocalCompose) {
                    println("Using local docker-compose.yml for $id")
                    pb.directory(moduleDir)
                } else {
                    pb.directory(File(homelabConfig.appRoot))
                }

                println(
                        "Executing: ${pb.command().joinToString(" ")} in ${pb.directory()?.absolutePath ?: "root"}"
                )
                val process = pb.start()
                val output = process.inputStream.bufferedReader().readText()
                val errorOutput = process.errorStream.bufferedReader().readText()
                val exitCode = process.waitFor()

                println("Docker Exit code: $exitCode")
                if (output.isNotBlank()) println("Docker Output:\n$output")
                if (errorOutput.isNotBlank()) println("Docker Error Output:\n$errorOutput")

                if (exitCode == 0) {
                    module.status = ModuleStatus.ACTIVE
                    module.uptimeStart = System.currentTimeMillis()
                    println("Module $id started successfully")
                    true
                } else {
                    module.status = ModuleStatus.ERROR
                    println("Module $id failed to start. Output: $output")
                    false
                }
            } catch (e: Exception) {
                module.status = ModuleStatus.ERROR
                println("Module $id failed to start with exception: ${e.message}")
                false
            }
        }
        println("Starting module $id as native application")
        val dir = moduleConfigs[id] ?: return false
        val configFile = File(dir, "homelab-module.json")
        val config = mapper.readValue(configFile, ModuleConfig::class.java)
        println("Config: $config")
        val command = config.startCommand ?: return false
        println("Start Command: $command")
        if (processes[id]?.isAlive == true) return true
        println("Starting module $id as native application")
        return try {
            module.status = ModuleStatus.STARTING
            val pb = ProcessBuilder(command.split(" ")).directory(dir).redirectErrorStream(true)

            if (System.getProperty("os.name").lowercase().contains("win")) {
                pb.command("cmd", "/c", command)
            }

            val process = pb.start()
            processes[id] = process
            module.status = ModuleStatus.ACTIVE
            module.uptimeStart = System.currentTimeMillis()
            println("Module $id started successfully")
            true
        } catch (e: Exception) {
            module.status = ModuleStatus.ERROR
            println("Error starting module $id: ${e.message}")
            false
        }
    }

    fun stopModule(id: String): Boolean {
        val module = modules[id] ?: return false

        if (module.type == ModuleType.DOCKER) {
            return try {
                module.status = ModuleStatus.STOPPING
                val pb = ProcessBuilder("docker", "compose", "stop", id)
                val moduleDir = moduleConfigs[id]
                val useLocalCompose =
                        moduleDir != null && File(moduleDir, "docker-compose.yml").exists()

                pb.directory(if (useLocalCompose) moduleDir else File(homelabConfig.appRoot))
                val process = pb.start()
                val exitCode = process.waitFor()
                if (exitCode == 0) {
                    module.status = ModuleStatus.INACTIVE
                    module.uptimeStart = null
                    true
                } else {
                    false
                }
            } catch (e: Exception) {
                false
            }
        }

        val process = processes[id] ?: return false

        module.status = ModuleStatus.STOPPING
        process.destroy()
        try {
            if (!process.waitFor(5, TimeUnit.SECONDS)) {
                process.destroyForcibly()
            }
        } catch (e: Exception) {}

        processes.remove(id)
        module.status = ModuleStatus.INACTIVE
        module.uptimeStart = null
        return true
    }

    fun installModule(id: String): Boolean {
        val module = modules[id] ?: return false
        if (module.type == ModuleType.DOCKER)
                return true // Docker modules don't need "install" this way

        val dir = moduleConfigs[id] ?: return false
        val configFile = File(dir, "homelab-module.json")
        val config = mapper.readValue(configFile, ModuleConfig::class.java)
        val command = config.installCommand ?: return false

        return try {
            module.status = ModuleStatus.INSTALLING
            val pb = ProcessBuilder(command.split(" ")).directory(dir).redirectErrorStream(true)

            if (System.getProperty("os.name").lowercase().contains("win")) {
                pb.command("cmd", "/c", command)
            }

            val process = pb.start()

            val exitCode = process.waitFor()
            module.status = if (exitCode == 0) ModuleStatus.INACTIVE else ModuleStatus.ERROR
            exitCode == 0
        } catch (e: Exception) {
            module.status = ModuleStatus.ERROR
            false
        }
    }

    fun healthCheck(id: String): Boolean {
        val module = modules[id] ?: return false
        if (module.status != ModuleStatus.ACTIVE) return false

        if (module.type == ModuleType.DOCKER) {
            return isContainerRunning(module.id)
        }

        return try {
            val connection = URL(module.internalUrl).openConnection() as HttpURLConnection
            connection.connectTimeout = 2000
            connection.readTimeout = 2000
            connection.requestMethod = "GET"
            connection.responseCode in 200..399
        } catch (e: Exception) {
            false
        }
    }
}
