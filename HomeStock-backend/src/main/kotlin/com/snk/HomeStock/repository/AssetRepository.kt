package com.snk.HomeStock.repository

import com.snk.HomeStock.domain.Asset
import org.springframework.data.jpa.repository.JpaRepository

interface AssetRepository : JpaRepository<Asset, Long> {
    fun findByName(name: String): Asset?
    fun deleteByName(name: String)
    fun findAllByNameIn(names: Collection<String>): List<Asset>
}
