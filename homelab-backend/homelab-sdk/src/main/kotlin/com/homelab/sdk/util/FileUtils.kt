package com.homelab.sdk.util

import com.homelab.sdk.helper.PathRules
import java.nio.file.Files
import java.nio.file.Path
import java.nio.file.StandardCopyOption

object FileUtils {
    fun moveFile(src: Path, tgt: Path, overwrite: Boolean = false, createDirs: Boolean = true, atomic: Boolean = true): Boolean {
        try {
            val target = tgt.toAbsolutePath().normalize()
            if (Files.exists(target) && !overwrite) return false
            if (createDirs) PathRules.createDirectoriesIfNeeded(target)
            return try {
                if (atomic) {
                    Files.move(src, target, *if (overwrite) arrayOf(StandardCopyOption.REPLACE_EXISTING, StandardCopyOption.ATOMIC_MOVE) else arrayOf(StandardCopyOption.ATOMIC_MOVE))
                } else {
                    Files.move(src, target, *if (overwrite) arrayOf(StandardCopyOption.REPLACE_EXISTING) else arrayOf())
                }
                true
            } catch (e: Exception) {
                // fallback non-atomic move
                try {
                    if (overwrite) Files.move(src, target, StandardCopyOption.REPLACE_EXISTING) else Files.move(src, target)
                    true
                } catch (ex: Exception) {
                    false
                }
            }
        } catch (e: Exception) {
            return false
        }
    }
}

