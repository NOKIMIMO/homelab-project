package com.homelab.sdk.util

object ValidationRules {
    fun isFileColumnName(name: String): Boolean {
        val n = name.lowercase()
        return n == "file" || n == "file_name" || n == "file_path" || n == "filepath"
    }
}

