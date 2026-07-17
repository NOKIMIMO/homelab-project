package com.homelab.core.model.alert

import org.junit.jupiter.api.Assertions.assertFalse
import org.junit.jupiter.api.Assertions.assertTrue
import org.junit.jupiter.api.Test

class AlertOperatorTest {

    @Test
    fun `GT is strictly greater than`() {
        assertTrue(AlertOperator.GT.test(91.0, 90.0))
        assertFalse(AlertOperator.GT.test(90.0, 90.0))
    }

    @Test
    fun `GTE includes equality`() {
        assertTrue(AlertOperator.GTE.test(90.0, 90.0))
        assertFalse(AlertOperator.GTE.test(89.9, 90.0))
    }

    @Test
    fun `LT is strictly less than`() {
        assertTrue(AlertOperator.LT.test(10.0, 20.0))
        assertFalse(AlertOperator.LT.test(20.0, 20.0))
    }

    @Test
    fun `LTE includes equality`() {
        assertTrue(AlertOperator.LTE.test(20.0, 20.0))
        assertFalse(AlertOperator.LTE.test(20.1, 20.0))
    }
}
