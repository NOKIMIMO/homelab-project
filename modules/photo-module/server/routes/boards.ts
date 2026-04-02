import { Router, Request, Response } from "express";
import { PhotoDataSource } from "../db/db";
import { Board } from "../entities/Board";
import { BoardAsset } from "../entities/BoardAsset";
import { recordSyncCheckpoint } from "../services/syncService";

interface BoardAssetPayload {
    asset_name: string;
    src: string;
    scale?: number;
    rotation?: number;
    x_position?: number;
    y_position?: number;
}

interface BoardPayload {
    name?: string;
    height?: number;
    width?: number;
    previewsrc?: string;
    assets?: BoardAssetPayload[];
}

import path from "path";

const normalizeAssets = (boardId: string, assets: BoardAssetPayload[]): BoardAsset[] => {
    return assets.map((asset) => {
        const boardAsset = new BoardAsset();
        boardAsset.board_id = boardId;
        boardAsset.asset_name = asset.src.split('/')[asset.src.split('/').length - 1]; 
        boardAsset.src = asset.src.split('/')[asset.src.split('/').length - 1]; // Keep the full src for frontend reference if needed
        boardAsset.scale = asset.scale ?? 1.0;
        boardAsset.rotation = asset.rotation ?? 0.0;
        boardAsset.x_position = asset.x_position ?? 0.0;
        boardAsset.y_position = asset.y_position ?? 0.0;
        return boardAsset;
    });
};

export const createBoardsRouter = (): Router => {
    const router = Router();

    router.get("/", async (_req: Request, res: Response) => {
        try {
            const boardRepository = PhotoDataSource.getRepository(Board);
            const boardAssetRepository = PhotoDataSource.getRepository(BoardAsset);

            const boards = await boardRepository.find({ order: { last_update: "DESC" } });
            const payload = await Promise.all(
                boards.map(async (board) => {
                    const assets = await boardAssetRepository.find({ where: { board_id: board.id } });
                    return { ...board, assets };
                })
            );

            res.json(payload);
        } catch (error) {
            console.error("Failed to list boards", error);
            res.status(500).json({ error: "Err" });
        }
    });

    router.get("/:id", async (req: Request, res: Response) => {
        try {
            const boardRepository = PhotoDataSource.getRepository(Board);
            const boardAssetRepository = PhotoDataSource.getRepository(BoardAsset);
            const board = await boardRepository.findOne({ where: { id: req.params.id } });
            if (!board) {
                return res.status(404).json({ error: "NotFound" });
            }
            const assets = await boardAssetRepository.find({ where: { board_id: board.id } });
            return res.json({ ...board, assets });
        } catch (error) {
            console.error("Failed to get board", error);
            return res.status(500).json({ error: "Err" });
        }
    });

    router.put("/:id", async (req: Request, res: Response) => {
        const body = req.body as BoardPayload;
        const boardId = req.params.id;

        try {
            await PhotoDataSource.transaction(async (manager) => {
                const boardRepository = manager.getRepository(Board);
                const boardAssetRepository = manager.getRepository(BoardAsset);

                let board = await boardRepository.findOne({ where: { id: boardId } });
                
                if (!board) {
                    // Create new board with the provided client-side UUID
                    board = boardRepository.create({
                        id: boardId,
                        name: body.name || "Untitled Board",
                        height: body.height ?? 1080,
                        width: body.width ?? 1920,
                        previewsrc: body.previewsrc,
                    });
                } else {
                    // Update existing board properties
                    board.name = body.name ?? board.name;
                    board.height = body.height ?? board.height;
                    board.width = body.width ?? board.width;
                    board.previewsrc = body.previewsrc ?? board.previewsrc;
                }

                await boardRepository.save(board);

                // Handle Assets (Full replace pattern for Boards)
                if (Array.isArray(body.assets)) {
                    await boardAssetRepository.delete({ board_id: boardId });
                    if (body.assets.length > 0) {
                        const boardAssets = normalizeAssets(boardId, body.assets);
                        await boardAssetRepository.save(boardAssets);
                    }
                }
            });

            await recordSyncCheckpoint();
            return res.json({ success: true, id: boardId });
        } catch (error) {
            console.error("Failed to upsert board", error);
            return res.status(500).json({ error: "Err" });
        }
    });

    router.delete("/:id", async (req: Request, res: Response) => {
        try {
            const repository = PhotoDataSource.getRepository(Board);
            const board = await repository.findOne({ where: { id: req.params.id } });
            if (!board) {
                return res.status(404).json({ error: "NotFound" });
            }

            await repository.delete({ id: board.id });
            await recordSyncCheckpoint();
            return res.json({ success: true });
        } catch (error) {
            console.error("Failed to delete board", error);
            return res.status(500).json({ error: "Err" });
        }
    });

    return router;
};
