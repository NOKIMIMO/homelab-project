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

const isImage = (filename: string): boolean => /\.(jpg|jpeg|png|gif|webp|mp4)$/i.test(filename);

const getPhotoMetadata = (storageDir: string, filename: string): PhotoResponse => {
    const filepath = path.join(storageDir, filename);
    const stats = fs.statSync(filepath);
    const candidates = [stats.birthtimeMs, stats.mtimeMs].filter((t) => t > 0);
    let oldest = candidates.length > 0 ? Math.min(...candidates) : Date.now();
    const metadata: PhotoMetadata = { stats };

    try {
        const bufferToUse = fs.readFileSync(filepath);
        const result = exifParser.create(bufferToUse).parse();
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
        url: filename, // Only store the filename here, absolute URL will be built in the request context
        date: oldest,
        uploadDate: stats.ctimeMs || stats.mtimeMs,
        metadata,
    };
};

const getBaseUrl = (req: Request): string => {
    // Rely on x-forwarded-host if behind a proxy, otherwise use host
    const host = req.get("x-forwarded-host") || req.get("host");
    const protocol = req.get("x-forwarded-proto") || req.protocol;
    return `${protocol}://${host}`;
};

export const createPhotosRouter = (storageDir: string): Router => {
    const router = Router();

    const tempDir = path.join(storageDir, ".temp");
    if (!fs.existsSync(tempDir)) {
        fs.mkdirSync(tempDir, { recursive: true });
    }

    // Stage incoming files to .temp folder so we don't pollute the main folder before checking
    const storage = multer.diskStorage({
        destination: (_req, _file, cb) => cb(null, tempDir),
        filename: (_req, file, cb) => {
            const sanitized = file.originalname.replace(/[^a-zA-Z0-9.]/g, "_");
            cb(null, `${Date.now()}-${sanitized}`);
        },
    });
    
    const upload = multer({ storage });

    router.get("/", async (req: Request, res: Response) => {
        try {
            const files = fs.readdirSync(storageDir).filter(isImage);
            const repository = PhotoDataSource.getRepository(Asset);

            const discovered = files.map((file) => getPhotoMetadata(storageDir, file));
            for (const photo of discovered) {
                const existing = await repository.findOne({ where: { name: photo.name } });
                if (!existing) {
                    const entity = repository.create({
                        name: photo.name,
                        metadata: photo.metadata as unknown as Record<string, any>,
                        date_photo: new Date(photo.date),
                        date_upload: new Date(photo.uploadDate),
                        origin: "local-scan",
                    });
                    await repository.save(entity);
                }
            }

            const baseUrl = getBaseUrl(req);
            const assets = files.length > 0 ? await repository.find({ where: { name: In(files) } }) : [];
            res.json(
                assets.map((asset) => ({
                    name: asset.name,
                    url: `${baseUrl}/storage/${asset.name}`,
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

        try {
            const tempFilepath = req.file.path;
            const sanitized = req.file.originalname.replace(/[^a-zA-Z0-9.]/g, "_");
            const finalFilename = sanitized;
            const finalFilepath = path.join(storageDir, finalFilename);

            const repository = PhotoDataSource.getRepository(Asset);
            
            // Deduplication Check
            let isDuplicate = false;
            let existingAsset = await repository.findOne({ where: { name: finalFilename } });
            
            if (fs.existsSync(finalFilepath)) {
                const tempStats = fs.statSync(tempFilepath);
                const finalStats = fs.statSync(finalFilepath);
                
                // If name AND size match, we consider it a duplicate to skip processing
                if (tempStats.size === finalStats.size) {
                    isDuplicate = true;
                    console.log(`Duplicate detected for ${finalFilename} (size match). Skipping storage/DB update.`);
                }
            }

            if (!isDuplicate) {
                // Apply last modified if provided
                const lastModified = req.body.lastModified ? Number(req.body.lastModified) : null;
                if (lastModified && !Number.isNaN(lastModified) && lastModified > 0) {
                    const t = new Date(lastModified);
                    try {
                        fs.utimesSync(tempFilepath, t, t);
                    } catch (e) {
                        console.warn("Failed to set utimes on temp file", e);
                    }
                }

                // Move file from temp to final destination
                fs.copyFileSync(tempFilepath, finalFilepath);

                // Get metadata from the FINAL file
                const photo = getPhotoMetadata(storageDir, finalFilename);
                
                if (existingAsset) {
                    // Update existing record metadata
                    existingAsset.metadata = photo.metadata as any;
                    existingAsset.date_photo = new Date(photo.date);
                    existingAsset.date_upload = new Date(photo.uploadDate);
                } else {
                    // Create new record
                    existingAsset = repository.create({
                        name: finalFilename,
                        metadata: photo.metadata as any,
                        date_photo: new Date(photo.date),
                        date_upload: new Date(photo.uploadDate),
                        origin: "local-upload",
                    });
                }

                await repository.save(existingAsset);
                await recordSyncCheckpoint();
            }

            // Always clean up the temp file
            if (fs.existsSync(tempFilepath)) {
                fs.unlinkSync(tempFilepath);
            }
            
            const baseUrl = getBaseUrl(req);
            return res.json({ 
                success: true, 
                file: finalFilename, 
                url: `${baseUrl}/storage/${finalFilename}`,
                skipped: isDuplicate
            });
        } catch (error) {
            console.error("Failed to process uploaded photo", error);
            return res.status(500).json({ error: "UploadFailed", details: error instanceof Error ? error.message : String(error) });
        }
    });

    router.post("/batch", upload.array("photos"), async (req: Request, res: Response) => {
        if (!req.files || (Array.isArray(req.files) && req.files.length === 0)) {
            return res.status(400).json({ error: "NoFiles" });
        }

        const files = req.files as Express.Multer.File[];
        const uploadedFiles: string[] = [];
        let anyChanges = false;

        try {
            const repository = PhotoDataSource.getRepository(Asset);

            for (const file of files) {
                const tempFilepath = file.path;
                const sanitized = file.originalname.replace(/[^a-zA-Z0-9.]/g, "_");
                const finalFilename = sanitized;
                const finalFilepath = path.join(storageDir, finalFilename);

                let isDuplicate = false;
                let existingAsset = await repository.findOne({ where: { name: finalFilename } });

                if (fs.existsSync(finalFilepath)) {
                    const tempStats = fs.statSync(tempFilepath);
                    const finalStats = fs.statSync(finalFilepath);
                    if (tempStats.size === finalStats.size) {
                        isDuplicate = true;
                    }
                }

                if (!isDuplicate) {
                    // Move file
                    fs.copyFileSync(tempFilepath, finalFilepath);

                    // Get metadata
                    const photo = getPhotoMetadata(storageDir, finalFilename);
                    
                    if (existingAsset) {
                        existingAsset.metadata = photo.metadata as any;
                        existingAsset.date_photo = new Date(photo.date);
                        existingAsset.date_upload = new Date(photo.uploadDate);
                    } else {
                        existingAsset = repository.create({
                            name: finalFilename,
                            metadata: photo.metadata as any,
                            date_photo: new Date(photo.date),
                            date_upload: new Date(photo.uploadDate),
                            origin: "local-batch-upload",
                        });
                    }
                    await repository.save(existingAsset);
                    anyChanges = true;
                }

                // Clean up temp
                if (fs.existsSync(tempFilepath)) {
                    fs.unlinkSync(tempFilepath);
                }

                uploadedFiles.push(finalFilename);
            }

            if (anyChanges) {
                await recordSyncCheckpoint();
            }
            
            const baseUrl = getBaseUrl(req);
            const absoluteUrls = uploadedFiles.map(filename => `${baseUrl}/storage/${filename}`);
            
            return res.json({ success: true, files: uploadedFiles, urls: absoluteUrls });
        } catch (error) {
            console.error("Failed to process batch upload", error);
            return res.status(500).json({ error: "BatchUploadFailed", details: error instanceof Error ? error.message : String(error) });
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
