package com.homelab.core.api.dto.modulebuilder

data class ModuleBuilderRequest(
    val id: String,
    val name: String,
    val description: String? = null,
    val tables: List<TableSpec> = emptyList(),
    val params: List<ModuleParamSpec> = emptyList(),
    val dependencies: List<DependencySpec> = emptyList(),
    // Persisted icon filename (eg. "icon.png"), set only via the dedicated icon-upload endpoint.
    val icon: String? = null,
    // "JSON" (declarative page, the default) or "STANDALONE" (pre-built dist/ bundle) --
    // set only via the dedicated UI-page/UI-build upload endpoints.
    val uiMode: String = "JSON",
    // True once a UI page/build has been uploaded by hand -- once set, createModule/updateModule/
    // addColumn stop regenerating the auto UI page so a hand-authored one is never clobbered.
    val uiCustomized: Boolean = false
)
