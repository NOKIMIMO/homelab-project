package com.homelab.core.service.module
import com.homelab.core.model.Module
import com.homelab.core.model.ModuleStatus
import java.io.File
import java.util.concurrent.ConcurrentHashMap
import org.springframework.stereotype.Service

@Service
class ModuleNativeService {
    private val processes = ConcurrentHashMap<String, Process>()

    fun updateModuleStatus(module: Module) {
        val process = processes[module.id]
        if (process != null && process.isAlive) {
            module.status = ModuleStatus.ACTIVE
            return
        }

        if (module.status == ModuleStatus.ACTIVE) {
            module.status = ModuleStatus.INACTIVE
            module.uptimeStart = null
            processes.remove(module.id)
        }
    }

    fun startModule(module: Module, moduleDir: File, command: String): Boolean {
        if (processes[module.id]?.isAlive == true) return true

        return try {
            module.status = ModuleStatus.STARTING
            val pb = ProcessBuilder(command.split(" ")).directory(moduleDir).redirectErrorStream(true)

            if (System.getProperty("os.name").lowercase().contains("win")) {
                pb.command("cmd", "/c", command)
            }

            val process = pb.start()
            processes[module.id] = process
            module.status = ModuleStatus.ACTIVE
            module.uptimeStart = System.currentTimeMillis()
            true
        } catch (e: Exception) {
            module.status = ModuleStatus.ERROR
            println("Error starting native module ${module.id}: ${e.message}")
            false
        }
    }

    fun stopModule(module: Module): Boolean {
        val process = processes[module.id] ?: return false

        module.status = ModuleStatus.STOPPING
        process.destroy()
        try {
            process.waitFor()
        } catch (_: Exception) {
        }

        processes.remove(module.id)
        module.status = ModuleStatus.INACTIVE
        module.uptimeStart = null
        return true
    }

    fun installModule(module: Module, moduleDir: File, command: String): Boolean {
        return try {
            module.status = ModuleStatus.INSTALLING
            val pb = ProcessBuilder(command.split(" ")).directory(moduleDir).redirectErrorStream(true)

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

    fun cleanupProcesses() {
        processes.values.forEach { process ->
            try {
                process.destroy()
            } catch (_: Exception) {
            }
        }
        processes.clear()
    }
}
