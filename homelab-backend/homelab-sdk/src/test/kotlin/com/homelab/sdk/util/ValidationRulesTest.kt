package com.homelab.sdk.util

import org.junit.jupiter.api.Assertions.assertFalse
import org.junit.jupiter.api.Assertions.assertTrue
import org.junit.jupiter.api.Test

class ValidationRulesTest {

    @Test
    fun `isFileColumnName recognizes known file column names case-insensitively`() {
        assertTrue(ValidationRules.isFileColumnName("file"))
        assertTrue(ValidationRules.isFileColumnName("FILE"))
        assertTrue(ValidationRules.isFileColumnName("file_name"))
        assertTrue(ValidationRules.isFileColumnName("file_path"))
        assertTrue(ValidationRules.isFileColumnName("FilePath"))
    }

    @Test
    fun `isFileColumnName rejects unrelated column names`() {
        assertFalse(ValidationRules.isFileColumnName("name"))
        assertFalse(ValidationRules.isFileColumnName("fileNameSuffix"))
        assertFalse(ValidationRules.isFileColumnName(""))
    }
}
