package com.homelab.sdk.helper

import java.nio.file.Files
import java.nio.file.Path
import java.nio.file.Paths

object PathRules {
    fun normalize(path: String, baseDir: Path? = null): Path {
        val p = Paths.get(path)
        val resolved = if (p.isAbsolute) p else (baseDir ?: Paths.get("")).resolve(p)
        return resolved.toAbsolutePath().normalize()
    }

    fun safeJoin(base: Path, relative: String): Path {
        val rel = Paths.get(relative)
        val candidate = if (rel.isAbsolute) rel else base.resolve(rel)
        return candidate.toAbsolutePath().normalize()
    }

    fun isWithinBase(path: Path, base: Path): Boolean {
        val realBase = base.toAbsolutePath().normalize()
        val realPath = path.toAbsolutePath().normalize()
        return realPath.startsWith(realBase)
    }

    fun createDirectoriesIfNeeded(path: Path) {
        try {
            val parent = path.parent
            if (parent != null && !Files.exists(parent)) Files.createDirectories(parent)
        } catch (e: Exception) {
            // swallow; caller will handle
        }
    }
}

