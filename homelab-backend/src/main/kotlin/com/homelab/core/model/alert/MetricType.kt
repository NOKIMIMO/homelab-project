package com.homelab.core.model.alert

/**
 * Metrics an alert rule can watch. All values are normalized to a 0-100 percentage so a single
 * numeric threshold ("filled at 90%") works uniformly across metrics.
 *
 * Extensible on purpose: add a new entry here and resolve its percentage in
 * [com.homelab.core.service.AlertService.metricPercent]. GPU load is intentionally not wired yet
 * because OSHI does not expose it portably (see project alert design decision).
 */
enum class MetricType(val label: String, val unit: String) {
    CPU("CPU load", "%"),
    RAM("RAM usage", "%"),
    DISK("Disk storage", "%"),
    // GPU("GPU load", "%") — to wire up once a reliable GPU source is available
}
