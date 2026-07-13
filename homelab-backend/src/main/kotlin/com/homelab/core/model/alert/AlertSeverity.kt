package com.homelab.core.model.alert

/** Gravity carried by an event when a rule fires. Configurable per rule from the front. */
enum class AlertSeverity {
    INFO,
    LOW,
    MEDIUM,
    HIGH,
    CRITICAL
}
