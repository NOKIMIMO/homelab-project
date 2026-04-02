import { Router, Request, Response } from "express";
import fs from "fs";
import path from "path";
import multer from "multer";
import exifParser from "exif-parser";
import { In } from "typeorm";
import { PhotoDataSource } from "../db/db";
import { Asset } from "../entities/Asset";
import { recordSyncCheckpoint } from "../services/syncService";

interface PhotoMetadata {
    stats: unknown;
    exif?: Record<string, unknown>;
    error?: string;
}

interface PhotoResponse {
    name: string;
    url: string;
    date: number;
    uploadDate: number;
    metadata: PhotoMetadata;
}

const isImage = (filename: string): boolean => /\.(jpg|jpeg|png|gif|webp)$/i.test(filename);

const getPhotoMetadata = (storageDir: string, filename: string): PhotoResponse => {
    const filepath = path.join(storageDir, filename);
    const stats = fs.statSync(filepath);
    const candidates = [stats.birthtimeMs, stats.mtimeMs].filter((t) => t > 0);
    let oldest = candidates.length > 0 ? Math.min(...candidates) : Date.now();
    const metadata: PhotoMetadata = { stats };

    try {
        const buffer = fs.readFileSync(filepath);
        const result = exifParser.create(buffer).parse();
        metadata.exif = result.tags ?? {};
        if (result.tags?.DateTimeOriginal) {
            const exif = Number(result.tags.DateTimeOriginal) * 1000;
            if (!Number.isNaN(exif) && exif > 0) {
                oldest = Math.min(oldest, exif);
            }
        }
    } catch (error: unknown) {
        metadata.error = error instanceof Error ? error.message : String(error);
    }

    return {
        name: filename,
        url: `storage/${filename}`,
        date: oldest,
        uploadDate: stats.ctimeMs || stats.mtimeMs,
        metadata,
    };
};

export const createPhotosRouter = (storageDir: string): Router => {
    const router = Router();

    const storage = multer.diskStorage({
        destination: (_req, _file, cb) => cb(null, storageDir),
        filename: (_req, file, cb) => {
            const sanitized = file.originalname.replace(/[^a-zA-Z0-9.]/g, "_");
            cb(null, `${Date.now()}-${sanitized}`);
        },
    });

    const upload = multer({ storage });

    router.get("/", async (_req: Request, res: Response) => {
        try {
            const files = fs.readdirSync(storageDir).filter(isImage);
            const repository = PhotoDataSource.getRepository(Asset);

            const discovered = files.map((file) => getPhotoMetadata(storageDir, file));
            for (const photo of discovered) {
                const existing = await repository.findOne({ where: { name: photo.name } });
                const entity = repository.create({
                    id: existing?.id,
                    name: photo.name,
                    metadata: photo.metadata as unknown as Record<string, any>,
                    date_photo: new Date(photo.date),
                    date_upload: new Date(photo.uploadDate),
                    origin: "local-upload",
                });
                await repository.save(entity);
            }

            const assets = files.length > 0 ? await repository.find({ where: { name: In(files) } }) : [];
            res.json(
                assets.map((asset) => ({
                    name: asset.name,
                    url: `storage/${asset.name}`,
                    date: asset.date_photo?.getTime() ?? asset.date_upload.getTime(),
                    uploadDate: asset.date_upload.getTime(),
                    metadata: (asset.metadata as PhotoMetadata) ?? { stats: {} },
                }))
            );
        } catch (error) {
            console.error("Failed to list photos", error);
            res.status(500).json({ error: "Err" });
        }
    });

    router.post("/", upload.single("photo"), async (req: Request, res: Response) => {
        if (!req.file) {
            return res.status(400).json({ error: "NoFile" });
        }

        const filepath = path.join(storageDir, req.file.filename);
        const lastModified = req.body.lastModified ? Number(req.body.lastModified) : null;
        if (lastModified && !Number.isNaN(lastModified) && lastModified > 0) {
            const t = new Date(lastModified);
            try {
                fs.utimesSync(filepath, t, t);
            } catch {
                // Ignore filesystem timestamp update failures.
            }
        }

        try {
            const photo = getPhotoMetadata(storageDir, req.file.filename);
            const repository = PhotoDataSource.getRepository(Asset);
            const existing = await repository.findOne({ where: { name: photo.name } });
            const entity = repository.create({
                id: existing?.id,
                name: photo.name,
                metadata: photo.metadata as unknown as Record<string, any>,
                date_photo: new Date(photo.date),
                date_upload: new Date(photo.uploadDate),
                origin: "local-upload",
            });
            await repository.save(entity);
            await recordSyncCheckpoint();
            return res.json({ success: true, file: req.file.filename });
        } catch (error) {
            console.error("Failed to persist uploaded photo metadata", error);
            return res.status(500).json({ error: "DbErr" });
        }
    });

    router.delete("/:filename", async (req: Request, res: Response) => {
        const { filename } = req.params;
        const filepath = path.join(storageDir, filename);
        try {
            const repository = PhotoDataSource.getRepository(Asset);
            if (fs.existsSync(filepath)) {
                fs.unlinkSync(filepath);
            }
            await repository.delete({ name: filename });
            await recordSyncCheckpoint();
            res.json({ success: true });
        } catch (error) {
            console.error("Failed to delete photo", error);
            res.status(500).json({ error: "Err" });
        }
    });

    return router;
};
