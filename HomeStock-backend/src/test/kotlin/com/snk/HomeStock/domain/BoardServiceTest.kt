package com.snk.HomeStock.domain

import com.snk.HomeStock.api.dto.BoardAssetPayload
import com.snk.HomeStock.api.dto.BoardPayload
import com.snk.HomeStock.service.BoardService
import com.snk.HomeStock.repository.AssetRepository
import com.snk.HomeStock.repository.BoardRepository
import com.snk.HomeStock.repository.model.Asset
import com.snk.HomeStock.repository.model.Board
import com.snk.HomeStock.repository.model.BoardAsset
import com.snk.HomeStock.repository.model.BoardAssetKey
import org.junit.jupiter.api.Assertions.assertEquals
import org.junit.jupiter.api.Assertions.assertNotNull
import org.junit.jupiter.api.Nested
import org.junit.jupiter.api.DisplayName
import org.junit.jupiter.api.Test
import org.junit.jupiter.api.extension.ExtendWith
import org.mockito.ArgumentMatchers.any
import org.mockito.ArgumentMatchers.anyString
import org.mockito.InjectMocks
import org.mockito.Mock
import org.mockito.Mockito.`when`
import org.mockito.Mockito.verify
import org.mockito.junit.jupiter.MockitoExtension
import org.mockito.ArgumentCaptor
import org.mockito.Mockito.times
import java.time.OffsetDateTime
import java.util.*

@ExtendWith(MockitoExtension::class)
class BoardServiceTest {

	@Mock
	lateinit var boardRepository: BoardRepository

	@Mock
	lateinit var assetRepository: AssetRepository

	@Mock
	lateinit var syncService: com.snk.HomeStock.service.SyncService

	@InjectMocks
	lateinit var boardService: BoardService

	@Nested
	@DisplayName("listBoards")
	inner class ListBoards {
		@Test
		fun `returns boards with assets mapped`() {
			val boardId = UUID.randomUUID()
			val board = Board(
				id = boardId,
				name = "TestBoard",
				height = 800,
				width = 600,
				previewsrc = null
			)

			val asset = Asset(
				id = 1L,
				name = "photo.jpg",
				metadata = null,
				datePhoto = null,
				dateUpload = OffsetDateTime.now(),
				origin = "test"
			)

			val boardAsset = BoardAsset(
				id = BoardAssetKey(boardId = boardId, assetName = "photo.jpg"),
				board = board,
				asset = asset,
				src = "/storage/photo.jpg",
				scale = 1.0f,
				rotation = 0.0f,
				xPosition = 10.0f,
				yPosition = 20.0f
			)

			board.assets.add(boardAsset)

			`when`(boardRepository.findAllWithAssets()).thenReturn(listOf(board))

			val result = boardService.listBoards()

			assertEquals(1, result.size)
			val dto = result.first()
			assertEquals(boardId.toString(), dto.id)
			assertEquals(1, dto.assets.size)
			val dtoAsset = dto.assets.first()
			assertEquals("photo.jpg", dtoAsset.assetName)
			assertEquals("/storage/photo.jpg", dtoAsset.src)
		}
	}

	@Nested
	@DisplayName("getBoard")
	inner class GetBoard {
		@Test
		fun `returns board when present`() {
			val boardId = UUID.randomUUID()
			val board = Board(
				id = boardId,
				name = "B2",
				height = 100,
				width = 200,
				previewsrc = null
			)

			val asset = Asset(
				id = 2L,
				name = "img.png",
				metadata = null,
				datePhoto = null,
				dateUpload = OffsetDateTime.now(),
				origin = "test"
			)

			val boardAsset = BoardAsset(
				id = BoardAssetKey(boardId = boardId, assetName = "img.png"),
				board = board,
				asset = asset,
				src = "/storage/img.png",
				scale = 1.0f,
				rotation = 0.0f,
				xPosition = 0.0f,
				yPosition = 0.0f
			)
			board.assets.add(boardAsset)

			`when`(boardRepository.findBoardWithAssetsById(boardId)).thenReturn(board)

			val dto = boardService.getBoard(boardId)
			assertNotNull(dto)
			assertEquals(boardId.toString(), dto!!.id)
			assertEquals(1, dto.assets.size)
			assertEquals("img.png", dto.assets.first().assetName)
		}
	}

	@Nested
	@DisplayName("upsertBoard")
	inner class UpsertBoard {
		@Test
		fun `creates new board and persists via repository`() {
			val boardId = UUID.randomUUID()
			val payload = BoardPayload(
				name = "NewBoard",
				height = 300,
				width = 400,
				previewsrc = null,
				assets = listOf(BoardAssetPayload(assetName = null, src = "/storage/new.jpg"))
			)

			`when`(boardRepository.findById(boardId)).thenReturn(Optional.empty())
			`when`(boardRepository.save(any(Board::class.java))).thenAnswer { it.arguments[0] }
			`when`(assetRepository.findByName(anyString())).thenReturn(null)

			val resultId = boardService.upsertBoard(boardId, payload)

			assertEquals(boardId, resultId)
			verify(boardRepository, times(1)).save(any(Board::class.java))
			verify(syncService, times(1)).recordSyncCheckpoint()
		}

		@Test
		fun `clamps asset positions to board edges`() {
			val boardId = UUID.randomUUID()
			val payload = BoardPayload(
				name = "ClampBoard",
				height = 300,
				width = 400,
				previewsrc = null,
				assets = listOf(BoardAssetPayload(assetName = null, src = "/storage/over.jpg", xPosition = -50.0f, yPosition = 1000.0f))
			)
			// pos en dehors du board

			`when`(boardRepository.findById(boardId)).thenReturn(Optional.empty())
			`when`(boardRepository.save(any(Board::class.java))).thenAnswer { it.arguments[0] }
			`when`(assetRepository.findByName(anyString())).thenReturn(null)

			boardService.upsertBoard(boardId, payload)

			val captor = ArgumentCaptor.forClass(Board::class.java) as ArgumentCaptor<Board>
			verify(boardRepository, times(1)).save(captor.capture())

			val saved: Board = captor.value
			assertEquals(1, saved.assets.size)

			val savedAsset = saved.assets.first()
			assertEquals(0.0f, savedAsset.xPosition)
			assertEquals(saved.height.toFloat(), savedAsset.yPosition)
		}
	}
}