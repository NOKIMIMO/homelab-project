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
    assets?: BoardAssetPayload[];
}

const normalizeAssets = (boardId: string, assets: BoardAssetPayload[]): BoardAsset[] => {
    return assets.map((asset) => {
        const boardAsset = new BoardAsset();
        boardAsset.board_id = boardId;
        boardAsset.asset_name = asset.asset_name;
        boardAsset.src = asset.src;
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

    router.post("/", async (req: Request, res: Response) => {
        const body = req.body as BoardPayload;
        if (!body.name) {
            return res.status(400).json({ error: "NameRequired" });
        }

        try {
            await PhotoDataSource.transaction(async (manager) => {
                const boardRepository = manager.getRepository(Board);
                const boardAssetRepository = manager.getRepository(BoardAsset);

                const board = boardRepository.create({
                    name: body.name,
                    height: body.height ?? 0,
                    width: body.width ?? 0,
                });

                const savedBoard = await boardRepository.save(board);

                if (Array.isArray(body.assets) && body.assets.length > 0) {
                    const boardAssets = normalizeAssets(savedBoard.id, body.assets);
                    await boardAssetRepository.save(boardAssets);
                }
            });

            await recordSyncCheckpoint();
            return res.status(201).json({ success: true });
        } catch (error) {
            console.error("Failed to create board", error);
            return res.status(500).json({ error: "Err" });
        }
    });

    router.put("/:id", async (req: Request, res: Response) => {
        const body = req.body as BoardPayload;

        try {
            const board = await PhotoDataSource.getRepository(Board).findOne({ where: { id: req.params.id } });
            if (!board) {
                return res.status(404).json({ error: "NotFound" });
            }

            await PhotoDataSource.transaction(async (manager) => {
                const boardRepository = manager.getRepository(Board);
                const boardAssetRepository = manager.getRepository(BoardAsset);

                board.name = body.name ?? board.name;
                board.height = body.height ?? board.height;
                board.width = body.width ?? board.width;
                await boardRepository.save(board);

                if (Array.isArray(body.assets)) {
                    await boardAssetRepository.delete({ board_id: board.id });
                    if (body.assets.length > 0) {
                        const boardAssets = normalizeAssets(board.id, body.assets);
                        await boardAssetRepository.save(boardAssets);
                    }
                }
            });

            await recordSyncCheckpoint();
            return res.json({ success: true });
        } catch (error) {
            console.error("Failed to update board", error);
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
