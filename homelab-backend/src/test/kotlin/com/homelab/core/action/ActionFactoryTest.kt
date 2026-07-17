package com.homelab.core.action

import com.homelab.core.config.HomelabConfig
import com.homelab.core.model.action.ActionsEnum
import com.homelab.core.model.action.DeleteAction
import com.homelab.core.model.action.FetchExternalAction
import com.homelab.core.model.action.GenericFetchExternalAction
import com.homelab.core.model.action.GetFileAction
import com.homelab.core.model.action.ListAction
import com.homelab.core.model.action.ReadAction
import com.homelab.core.model.action.SimpleCreateAction
import com.homelab.core.model.action.UpdateAction
import com.homelab.core.model.action.UploadFileAction
import com.homelab.core.plugin.PluginRegistry
import com.homelab.core.service.GlobalParametersService
import com.homelab.core.service.ResourceLimitsService
import com.homelab.sdk.action.Action
import org.junit.jupiter.api.Assertions.assertEquals
import org.junit.jupiter.api.Assertions.assertNull
import org.junit.jupiter.api.Assertions.assertSame
import org.junit.jupiter.api.Assertions.assertTrue
import org.junit.jupiter.api.BeforeEach
import org.junit.jupiter.api.Test
import org.mockito.Mockito.mock
import org.mockito.Mockito.`when`

class ActionFactoryTest {

    private lateinit var pluginRegistry: PluginRegistry
    private lateinit var factory: ActionFactory

    @BeforeEach
    fun setUp() {
        pluginRegistry = mock(PluginRegistry::class.java)
        factory = ActionFactory(
            pluginRegistry,
            mock(GlobalParametersService::class.java),
            mock(ResourceLimitsService::class.java),
            mock(HomelabConfig::class.java)
        )
    }

    @Test
    fun `resolve returns the expected builtin implementation for every builtin action type`() {
        assertTrue(factory.resolve(ActionsEnum.DELETE.name) is DeleteAction)
        assertTrue(factory.resolve(ActionsEnum.READ.name) is ReadAction)
        assertTrue(factory.resolve(ActionsEnum.LIST.name) is ListAction)
        assertTrue(factory.resolve(ActionsEnum.UPDATE.name) is UpdateAction)
        assertTrue(factory.resolve(ActionsEnum.CREATE.name) is SimpleCreateAction)
        assertTrue(factory.resolve(ActionsEnum.GET_FILE.name) is GetFileAction)
        assertTrue(factory.resolve(ActionsEnum.UPLOAD_FILE.name) is UploadFileAction)
        assertTrue(factory.resolve(ActionsEnum.FETCH_EXTERNAL.name) is FetchExternalAction)
        assertTrue(factory.resolve(ActionsEnum.FETCH_EXTERNAL_GENERIC.name) is GenericFetchExternalAction)
    }

    @Test
    fun `resolve returns null for the PUT action which has no builtin implementation`() {
        `when`(pluginRegistry.getAction(ActionsEnum.PUT.name)).thenReturn(null)

        assertNull(factory.resolve(ActionsEnum.PUT.name))
    }

    @Test
    fun `resolve falls back to the plugin registry for unknown types`() {
        val pluginAction = mock(Action::class.java)
        `when`(pluginRegistry.getAction("CUSTOM_PLUGIN_TYPE")).thenReturn(pluginAction)

        assertSame(pluginAction, factory.resolve("CUSTOM_PLUGIN_TYPE"))
    }

    @Test
    fun `resolve returns null when neither a builtin nor a plugin matches`() {
        `when`(pluginRegistry.getAction("NOPE")).thenReturn(null)

        assertNull(factory.resolve("NOPE"))
    }

    @Test
    fun `getAvailableActionTypes combines builtins with plugin registered types`() {
        `when`(pluginRegistry.getRegisteredTypes()).thenReturn(listOf("CUSTOM_A", "CUSTOM_B"))

        val types = factory.getAvailableActionTypes()

        assertEquals(9, types.count { it in ActionsEnum.entries.map(ActionsEnum::name) })
        assertTrue(types.containsAll(listOf("CUSTOM_A", "CUSTOM_B")))
        assertEquals(9 + 2, types.size)
        assertTrue(ActionsEnum.PUT.name !in types)
    }
}
