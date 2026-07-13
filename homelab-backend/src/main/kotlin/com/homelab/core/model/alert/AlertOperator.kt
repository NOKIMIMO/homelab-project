package com.homelab.core.model.alert

/** Comparison used to decide whether a metric value crosses a rule's threshold. */
enum class AlertOperator(val symbol: String) {
    GT(">"),
    GTE(">="),
    LT("<"),
    LTE("<=");

    fun test(value: Double, threshold: Double): Boolean = when (this) {
        GT -> value > threshold
        GTE -> value >= threshold
        LT -> value < threshold
        LTE -> value <= threshold
    }
}
