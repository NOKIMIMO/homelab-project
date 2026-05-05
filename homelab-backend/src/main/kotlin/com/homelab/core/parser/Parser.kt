package com.homelab.core.parser

import org.w3c.dom.Element

interface Parser<T> {
    fun parse(element: Element): T
}
