package com.homelab.core.service

import com.homelab.core.service.module.ModuleParamsService
import org.springframework.stereotype.Service

@Service
class GlobalParametersService(private val moduleParamsService: ModuleParamsService) {

    fun getParam(moduleId: String, key: String): String? =
        moduleParamsService.getRawValues(moduleId)[key]

    fun getAllParams(moduleId: String): Map<String, String?> =
        moduleParamsService.getRawValues(moduleId)
}
