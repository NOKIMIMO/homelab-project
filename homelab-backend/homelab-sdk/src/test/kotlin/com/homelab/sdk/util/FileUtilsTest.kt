package com.homelab.sdk.util

import org.junit.jupiter.api.Assertions.assertEquals
import org.junit.jupiter.api.Assertions.assertFalse
import org.junit.jupiter.api.Assertions.assertTrue
import org.junit.jupiter.api.Test
import java.nio.file.Files

class FileUtilsTest {

    @Test
    fun `moveFile moves a file to a new location creating parent dirs`() {
        val root = Files.createTempDirectory("file-utils-test")
        val src = Files.createFile(root.resolve("source.txt"))
        Files.writeString(src, "hello")
        val target = root.resolve("nested/dir/target.txt")

        val moved = FileUtils.moveFile(src, target)

        assertTrue(moved)
        assertTrue(Files.exists(target))
        assertFalse(Files.exists(src))
        assertEquals("hello", Files.readString(target))
    }

    @Test
    fun `moveFile refuses to overwrite existing target by default`() {
        val root = Files.createTempDirectory("file-utils-test-overwrite")
        val src = Files.createFile(root.resolve("source.txt"))
        val target = Files.createFile(root.resolve("target.txt"))
        Files.writeString(target, "original")

        val moved = FileUtils.moveFile(src, target, overwrite = false)

        assertFalse(moved)
        assertTrue(Files.exists(src))
        assertEquals("original", Files.readString(target))
    }

    @Test
    fun `moveFile overwrites existing target when requested`() {
        val root = Files.createTempDirectory("file-utils-test-force-overwrite")
        val src = Files.createFile(root.resolve("source.txt"))
        Files.writeString(src, "new-content")
        val target = Files.createFile(root.resolve("target.txt"))
        Files.writeString(target, "original")

        val moved = FileUtils.moveFile(src, target, overwrite = true)

        assertTrue(moved)
        assertEquals("new-content", Files.readString(target))
    }

    @Test
    fun `moveFile returns false when source does not exist`() {
        val root = Files.createTempDirectory("file-utils-test-missing-source")
        val src = root.resolve("does-not-exist.txt")
        val target = root.resolve("target.txt")

        val moved = FileUtils.moveFile(src, target)

        assertFalse(moved)
    }
}
