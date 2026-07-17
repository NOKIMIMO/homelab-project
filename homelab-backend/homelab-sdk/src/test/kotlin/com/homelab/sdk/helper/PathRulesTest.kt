package com.homelab.sdk.helper

import org.junit.jupiter.api.Assertions.assertEquals
import org.junit.jupiter.api.Assertions.assertFalse
import org.junit.jupiter.api.Assertions.assertTrue
import org.junit.jupiter.api.Test
import java.nio.file.Files
import java.nio.file.Paths

class PathRulesTest {

    @Test
    fun `normalize resolves relative path against base dir`() {
        val base = Paths.get("/base/dir").toAbsolutePath()
        val result = PathRules.normalize("child/file.txt", base)
        assertEquals(base.resolve("child/file.txt").normalize(), result)
    }

    @Test
    fun `normalize keeps absolute path as is`() {
        val absolute = Paths.get("/base/dir/file.txt").toAbsolutePath().normalize()
        val result = PathRules.normalize(absolute.toString(), Paths.get("/other"))
        assertEquals(absolute, result)
    }

    @Test
    fun `safeJoin resolves relative path under base`() {
        val base = Paths.get("/base/dir").toAbsolutePath()
        val result = PathRules.safeJoin(base, "sub/file.txt")
        assertEquals(base.resolve("sub/file.txt").normalize(), result)
    }

    @Test
    fun `safeJoin does not stop absolute relative from escaping base`() {
        val base = Paths.get("/base/dir").toAbsolutePath()
        val result = PathRules.safeJoin(base, "/etc/passwd")
        assertEquals(Paths.get("/etc/passwd").toAbsolutePath().normalize(), result)
    }

    @Test
    fun `isWithinBase is true for a path nested under base`() {
        val base = Paths.get("/base/dir").toAbsolutePath()
        val nested = base.resolve("sub/file.txt")
        assertTrue(PathRules.isWithinBase(nested, base))
    }

    @Test
    fun `isWithinBase is false for a path traversing outside base`() {
        val base = Paths.get("/base/dir").toAbsolutePath()
        val outside = base.resolve("../../etc/passwd")
        assertFalse(PathRules.isWithinBase(outside, base))
    }

    @Test
    fun `createDirectoriesIfNeeded creates missing parent directories`() {
        val tempRoot = Files.createTempDirectory("path-rules-test")
        val target = tempRoot.resolve("a/b/c/file.txt")

        PathRules.createDirectoriesIfNeeded(target)

        assertTrue(Files.exists(target.parent))
    }

    @Test
    fun `createDirectoriesIfNeeded does nothing when parent already exists`() {
        val tempRoot = Files.createTempDirectory("path-rules-test-existing")
        val target = tempRoot.resolve("file.txt")

        PathRules.createDirectoriesIfNeeded(target)

        assertTrue(Files.exists(tempRoot))
    }
}
