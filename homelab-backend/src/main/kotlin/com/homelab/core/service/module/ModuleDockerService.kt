package com.homelab.core.service.module
import com.homelab.core.model.Module
import com.homelab.core.model.ModuleStatus
import java.io.File
import java.util.concurrent.TimeUnit
import org.springframework.stereotype.Service

@Service
class ModuleDockerService(private val moduleDatabaseService: ModuleDatabaseService) {
    private val composeProjectName = System.getenv("HOMELAB_COMPOSE_PROJECT") ?: "homelab"

    data class DockerCommandResult(val success: Boolean, val output: String, val exitCode: Int)

    fun stopManagedContainers() {
        val process =
                ProcessBuilder(
                                "sh",
                                "-c",
                                "docker ps -q --filter \"label=com.homelab.managed=true\" | xargs -r docker stop"
                        )
                        .inheritIO()
                        .start()
        process.waitFor(10, TimeUnit.SECONDS)
    }

    fun isContainerRunning(containerName: String, moduleDir: File?, appRoot: String): Boolean {
        return try {
            val pb = ProcessBuilder(composeCommand("ps", "--format", "json", containerName))
            pb.directory(resolveComposeDirectory(moduleDir, appRoot))

            val process = pb.start()
            val output = process.inputStream.bufferedReader().readText().trim()
            output.contains("\"State\":\"running\"", ignoreCase = true) ||
                    output.contains("running", ignoreCase = true)
        } catch (_: Exception) {
            false
        }
    }

    fun startModule(
            moduleId: String,
            moduleDir: File?,
            appRoot: String,
            moduleDbName: String?
    ): DockerCommandResult {
        val pb =
                ProcessBuilder(composeCommand("up", "-d", moduleId))
                        .redirectErrorStream(true)
                        .directory(resolveComposeDirectory(moduleDir, appRoot))
        pb.environment().putAll(buildDockerEnvironment(moduleId, moduleDbName, moduleDir, appRoot))
        return execute(pb)
    }

    fun startManagedModule(
            module: Module,
            moduleDir: File?,
            appRoot: String,
            moduleDbName: String?
    ): Boolean {
        println("Starting module ${module.id} as docker container")
        return try {
            module.status = ModuleStatus.STARTING
            val result =
                    startModule(
                            moduleId = module.id,
                            moduleDir = moduleDir,
                            appRoot = appRoot,
                            moduleDbName = moduleDbName
                    )

            println("Docker Exit code: ${result.exitCode}")
            if (result.output.isNotBlank()) println("Docker Output:\n${result.output}")

            if (result.success) {
                module.status = ModuleStatus.ACTIVE
                module.uptimeStart = System.currentTimeMillis()
                println("Module ${module.id} started successfully")
                true
            } else {
                module.status = ModuleStatus.ERROR
                println("Module ${module.id} failed to start. Output: ${result.output}")
                false
            }
        } catch (e: Exception) {
            module.status = ModuleStatus.ERROR
            println("Module ${module.id} failed to start with exception: ${e.message}")
            false
        }
    }

    fun startManagedModuleDev(
            module: Module,
            moduleDir: File?,
            appRoot: String,
            moduleDbName: String?
    ): Boolean {
        if (moduleDir == null || !File(moduleDir, "docker-compose.yml").exists()) {
            println("No local docker-compose.yml for ${module.id}, falling back to standard start")
            return startManagedModule(module, moduleDir, appRoot, moduleDbName)
        }

        val devComposeFile = File(moduleDir, "docker-compose.dev.yml")
        val tempComposeFile = File(moduleDir, "docker-compose.temp.yml")
        if (!devComposeFile.exists() && !tempComposeFile.exists()) {
            println("No docker-compose.dev.yml found for ${module.id}, falling back to standard start")
            return startManagedModule(module, moduleDir, appRoot, moduleDbName)
        }

        return try {
            module.status = ModuleStatus.STARTING
            val result =
                    startModuleDev(
                            moduleId = module.id,
                            moduleDir = moduleDir,
                            useDevCompose = devComposeFile.exists(),
                            useTempCompose = tempComposeFile.exists(),
                            moduleDbName = moduleDbName,
                            appRoot = appRoot
                    )

            if (result.output.isNotBlank()) println("Docker dev output:\n${result.output}")
            println("Docker dev exit code: ${result.exitCode}")

            if (result.success) {
                module.status = ModuleStatus.ACTIVE
                module.uptimeStart = System.currentTimeMillis()
                println("Module ${module.id} started in development mode")
                true
            } else {
                module.status = ModuleStatus.ERROR
                println("Module ${module.id} failed to start in development mode")
                false
            }
        } catch (e: Exception) {
            module.status = ModuleStatus.ERROR
            println("Module ${module.id} failed to start in development mode: ${e.message}")
            false
        }
    }

    fun startModuleDev(
            moduleId: String,
            moduleDir: File,
            useDevCompose: Boolean,
            useTempCompose: Boolean,
            moduleDbName: String?,
            appRoot: String
    ): DockerCommandResult {
        val command = composeCommand("-f", "docker-compose.yml").toMutableList()
        when {
            useDevCompose -> command.addAll(listOf("-f", "docker-compose.dev.yml"))
            useTempCompose -> command.addAll(listOf("-f", "docker-compose.temp.yml"))
        }
        command.addAll(listOf("up", "-d", "--build", moduleId))

        val pb = ProcessBuilder(command).redirectErrorStream(true).directory(moduleDir)
        pb.environment().putAll(buildDockerEnvironment(moduleId, moduleDbName, moduleDir, appRoot))
        return execute(pb)
    }

    fun stopModule(moduleId: String, moduleDir: File?, appRoot: String): Boolean {
        return try {
            val pb = ProcessBuilder(composeCommand("stop", moduleId))
            pb.directory(resolveComposeDirectory(moduleDir, appRoot))
            pb.start().waitFor() == 0
        } catch (_: Exception) {
            false
        }
    }

    private fun resolveComposeDirectory(moduleDir: File?, appRoot: String): File {
        if (moduleDir == null) {
            return File(appRoot)
        }

        val composeFileExists = File(moduleDir.absolutePath, "docker-compose.yml").exists()
        return if (composeFileExists) moduleDir else File(appRoot)
    }

    private fun composeCommand(vararg args: String): List<String> {
        val command = mutableListOf("docker", "compose", "-p", composeProjectName)
        command.addAll(args)
        return command
    }

    private fun buildDockerEnvironment(
            moduleId: String,
            moduleDbName: String?,
            moduleDir: File?,
            appRoot: String
    ): Map<String, String> {
        val connectionInfo = moduleDatabaseService.getConnectionInfo() ?: return emptyMap()
        val env = mutableMapOf<String, String>()

        env["DB_HOST"] = connectionInfo.host
        env["DB_PORT"] = connectionInfo.port.toString()
        env["DB_USERNAME"] = connectionInfo.username
        env["DB_PASSWORD"] = connectionInfo.password
        env["CORE_DB_DATABASE"] = connectionInfo.database

        val normalizedModuleDbName = moduleDbName?.trim().orEmpty()
        if (normalizedModuleDbName.isNotBlank()) {
            env["DB_DATABASE"] = normalizedModuleDbName
        }

        if (moduleDir != null) {
            val hostRoot = System.getenv("HOMELAB_HOST_PROJECT_ROOT")?.trim().orEmpty()
            if (hostRoot.isNotBlank()) {
                val modulePath = moduleDir.absolutePath
                val appRootPath = File(appRoot).absolutePath
                val relative = if (modulePath.startsWith(appRootPath)) modulePath.removePrefix(appRootPath) else ""
                val normalizedRelative = relative.trimStart('/', '\\').replace('\\', '/')
                val normalizedHostRoot = hostRoot.trimEnd('/', '\\')
                env["MODULE_HOST_PATH"] =
                        if (normalizedRelative.isNotBlank()) "$normalizedHostRoot/$normalizedRelative"
                        else normalizedHostRoot
                println("Resolved MODULE_HOST_PATH for $moduleId: ${env["MODULE_HOST_PATH"]}")
            } else {
                println("HOMELAB_HOST_PROJECT_ROOT is not set, MODULE_HOST_PATH fallback will be used")
            }
        }

        return env
    }

    private fun execute(pb: ProcessBuilder): DockerCommandResult {
        val process = pb.start()
        val output = process.inputStream.bufferedReader().readText()
        val exitCode = process.waitFor()
        return DockerCommandResult(success = exitCode == 0, output = output, exitCode = exitCode)
    }
}
