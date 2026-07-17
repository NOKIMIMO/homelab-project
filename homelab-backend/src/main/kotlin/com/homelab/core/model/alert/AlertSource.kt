package com.homelab.core.model.alert

/**
 * What produced an [AlertEvent]. Lets the single alert/notification pipeline carry more than just
 * metric-threshold breaches:
 *  - [RULE]    — a user-defined threshold rule fired (metric/threshold/value are populated).
 *  - [ACCOUNT] — a new sign-up is awaiting admin validation.
 *  - [ERROR]   — the server logged an error (coalesced into a single notification, see
 *                [com.homelab.core.service.SystemAlertService]).
 *
 * The mobile app treats them uniformly (severity + message drive the notification); the source only
 * refines the title and, for [ERROR], collapses repeats into one notification.
 */
enum class AlertSource {
    RULE,
    ACCOUNT,
    ERROR,
}
