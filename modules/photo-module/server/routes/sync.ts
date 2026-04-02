import { Router, Request, Response } from "express";
import { getLatestSyncDate } from "../services/syncService";

export const createSyncRouter = (): Router => {
    const router = Router();

    router.get("/last", async (_req: Request, res: Response) => {
        try {
            const lastSync = await getLatestSyncDate();
            return res.json({
                lastSync: lastSync ? lastSync.getTime() : null,
                lastSyncIso: lastSync ? lastSync.toISOString() : null,
            });
        } catch (error) {
            console.error("Failed to retrieve latest sync", error);
            return res.status(500).json({ error: "Err" });
        }
    });

    router.get("/check", async (req: Request, res: Response) => {
        try {
            const since = req.query.since ? Number(req.query.since) : null;
            const lastSync = await getLatestSyncDate();
            const lastSyncMs = lastSync ? lastSync.getTime() : null;
            const changed = since === null || lastSyncMs === null ? true : lastSyncMs !== since;

            return res.json({
                changed,
                since,
                lastSync: lastSyncMs,
                lastSyncIso: lastSync ? lastSync.toISOString() : null,
                action: changed ? "upload_all_photos_and_board" : "noop",
            });
        } catch (error) {
            console.error("Failed to check sync state", error);
            return res.status(500).json({ error: "Err" });
        }
    });

    return router;
};
