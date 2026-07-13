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
    CPU("Charge CPU", "%"),
    RAM("Mémoire RAM", "%"),
    DISK("Stockage disque", "%"),
    // GPU("Charge GPU", "%") — à brancher quand une source GPU fiable sera disponible
}
