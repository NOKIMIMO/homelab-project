package com.homelab.core.helper

import org.junit.jupiter.api.Assertions.assertEquals
import org.junit.jupiter.api.Test
import java.nio.file.Files

class DiskUsageTest {

    @Test
    fun `folderSizeBytes sums regular file sizes up to depth two`() {
        val root = Files.createTempDirectory("disk-usage-test")
        Files.writeString(root.resolve("a.txt"), "12345")
        val sub = Files.createDirectory(root.resolve("sub"))
        Files.writeString(sub.resolve("b.txt"), "1234567890")

        val size = DiskUsage.folderSizeBytes(root)

        assertEquals(15L, size)
    }

    @Test
    fun `folderSizeBytes excludes paths nested under an excluded root`() {
        val root = Files.createTempDirectory("disk-usage-test-excluded")
        Files.writeString(root.resolve("a.txt"), "12345")
        val excluded = Files.createDirectory(root.resolve("excluded"))
        Files.writeString(excluded.resolve("b.txt"), "1234567890")

        val size = DiskUsage.folderSizeBytes(root, setOf(excluded))

        assertEquals(5L, size)
    }

    @Test
    fun `folderSizeBytes returns zero for a non-existent root`() {
        val missing = Files.createTempDirectory("disk-usage-test-missing").resolve("does-not-exist")

        assertEquals(0L, DiskUsage.folderSizeBytes(missing))
    }
}
