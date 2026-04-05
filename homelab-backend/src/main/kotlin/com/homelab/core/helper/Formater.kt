package com.homelab.core.helper

import java.math.BigDecimal
import java.math.RoundingMode

class Formater() {
    companion object {
        private const val BYTES_PER_KB = 1024.0
        private const val BYTES_PER_GB = 1024.0 * 1024.0 * 1024.0

        data class SizeValue(val value: Double, val unit: String)

        fun round(value: Double, decimals: Int): Double {
            return BigDecimal(value).setScale(decimals, RoundingMode.HALF_UP).toDouble()
        }

        // Input is a generic size value expressed in bytes.
        fun formatDoubleToBestSizeUnit(bytes: Double): SizeValue {
            if (bytes <= 0.0) return SizeValue(0.0, "KB")

            val kb = bytes / BYTES_PER_KB
            val mb = kb / BYTES_PER_KB
            val gb = mb / BYTES_PER_KB

            return when {
                gb >= 1.0 -> SizeValue(round(gb, 2), "GB")
                mb >= 1.0 -> SizeValue(round(mb, 2), "MB")
                else -> SizeValue(round(kb, 2), "KB")
            }
        }

        fun formatGigabytesToBestSizeUnit(gigabytes: Double): SizeValue {
            val bytes = gigabytes * BYTES_PER_GB
            return formatDoubleToBestSizeUnit(bytes)
        }

        fun bytesToGigabytes(bytes: Long): Double = bytes / BYTES_PER_GB

        fun bytesToGigabytes(bytes: Double): Double = bytes / BYTES_PER_GB

        fun formatBytes(bytes: Long): String {
            if (bytes < 1024) return "$bytes B"
            val exp = (Math.log(bytes.toDouble()) / Math.log(1024.0)).toInt()
            val pre = "KMGTPE"[exp - 1]
            return String.format("%.1f %sB", bytes / Math.pow(1024.0, exp.toDouble()), pre)
        }
    }
}