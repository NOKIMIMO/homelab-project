package com.homelab.core.model.action

/**
 * Dotted JSON path resolution shared by the fetch/map actions (eg. `weather[0].description`,
 * `main.temp`) against a parsed JSON body (nested Map/List structure).
 */
object JsonPathResolver {
    fun resolve(json: Any?, path: String): Any? {
        var current: Any? = json
        for (segment in path.split(".")) {
            if (current == null) return null
            val arrayMatch = Regex("^(\\w+)\\[(\\d+)]$").find(segment)
            current = if (arrayMatch != null) {
                val (key, indexStr) = arrayMatch.destructured
                val list = (current as? Map<*, *>)?.get(key) as? List<*>
                list?.getOrNull(indexStr.toInt())
            } else {
                (current as? Map<*, *>)?.get(segment)
            }
        }
        return current
    }
}
