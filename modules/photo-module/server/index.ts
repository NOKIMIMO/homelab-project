import express, { Request, Response } from 'express';
import cors from 'cors';
import path from 'path';
import fs from 'fs';
import multer from 'multer';
import exifParser from 'exif-parser';
import { createProxyMiddleware } from 'http-proxy-middleware';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

interface PhotoMetadata {
    stats: fs.Stats;
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

const app = express();
const port = 8081;

app.use(cors());
app.use(express.json());

const storageDir = path.join(__dirname, '..', 'public', 'storage');
const distDir = path.join(__dirname, '..', 'dist');
console.log(`Paths: dist=${distDir}, storage=${storageDir}`);
if (!fs.existsSync(storageDir)) {
    console.log(`Creating storage: ${storageDir}`);
    fs.mkdirSync(storageDir, { recursive: true });
}
if (fs.existsSync(distDir)) {
    console.log(`Frontend found in ${distDir}. Static serving enabled.`);
} else {
    console.log(`Frontend NOT found in ${distDir}. Falling back to dev proxy.`);
}

const storage = multer.diskStorage({
    destination: (_req, _file, cb) => cb(null, storageDir),
    filename: (_req, file, cb) => {
        const sanitized = file.originalname.replace(/[^a-zA-Z0-9.]/g, '_');
        cb(null, `${Date.now()}-${sanitized}`);
    }
});
const upload = multer({ storage });

function getPhotoMetadata(filename: string): PhotoResponse {
    const filepath = path.join(storageDir, filename);
    const stats = fs.statSync(filepath);
    const candidates = [stats.birthtimeMs, stats.mtimeMs].filter(t => t > 0);
    let oldest = candidates.length > 0 ? Math.min(...candidates) : Date.now();
    const metadata: PhotoMetadata = { stats };
    try {
        const buffer = fs.readFileSync(filepath);
        const result = exifParser.create(buffer).parse();
        metadata.exif = result.tags ?? {};
        if (result.tags?.DateTimeOriginal) {
            const exif = Number(result.tags.DateTimeOriginal) * 1000;
            if (!isNaN(exif) && exif > 0) oldest = Math.min(oldest, exif);
        }
    } catch (e: unknown) {
        metadata.error = e instanceof Error ? e.message : String(e);
    }
    return { name: filename, url: `storage/${filename}`, date: oldest, uploadDate: stats.ctimeMs || stats.mtimeMs, metadata };
}

app.use('/storage', express.static(storageDir));

app.get('/api/photos', (_req: Request, res: Response) => {
    console.log('Listing photos in storage');
    fs.readdir(storageDir, (err, files) => {
        if (err) return res.status(500).json({ error: 'Err' });
        res.json(files.filter(f => /\.(jpg|jpeg|png|gif|webp)$/i.test(f)).map(getPhotoMetadata));
    });
});

app.post('/api/photos', upload.single('photo'), (req: Request, res: Response) => {
    console.log(`Received upload: ${req.file?.originalname} as ${req.file?.filename}`);
    if (!req.file) return res.status(400).json({ error: 'NoFile' });
    const filepath = path.join(storageDir, req.file.filename);
    const lastModified = req.body.lastModified ? Number(req.body.lastModified) : null;
    if (lastModified && !isNaN(lastModified) && lastModified > 0) {
        const t = new Date(lastModified);
        try { fs.utimesSync(filepath, t, t); } catch { }
    }
    res.json({ success: true, file: req.file.filename });
});

app.delete('/api/photos/:filename', (req: Request, res: Response) => {
    const { filename } = req.params;
    const filepath = path.join(storageDir, filename);
    if (fs.existsSync(filepath)) {
        try { fs.unlinkSync(filepath); res.json({ success: true }); }
        catch { res.status(500).json({ error: 'Err' }); }
    } else {
        res.status(404).json({ error: 'NotFound' });
    }
});

if (fs.existsSync(distDir)) {
    app.use(express.static(distDir));
    app.get('*', (_req: Request, res: Response) => res.sendFile(path.join(distDir, 'index.html')));
} else {
    app.use('/', createProxyMiddleware({
        target: 'http://localhost:5173',
        changeOrigin: true,
        ws: true,
        pathRewrite: {
            '^/': '/' // Ensure paths are rewritten correctly
        },
        onProxyReq: (proxyReq, req) => {
            console.log(`Proxying request: ${req.method} ${req.url}`);
        },
        onProxyRes: (proxyRes, req, res) => {
            console.log(`Proxy response for: ${req.method} ${req.url} - Status: ${proxyRes.statusCode}`);
            delete proxyRes.headers['x-frame-options'];
            delete proxyRes.headers['content-security-policy'];
            proxyRes.headers['proxyed-by'] = 'Local Express Server';
        },
        onError: (err, req, res) => {
            console.error('Proxy error:', err.message);
            res.status(502).send("Express can't connect to Vite on port 5173. Ensure 'npm run dev' is running.");
        }
    }));
}

app.listen(port, '0.0.0.0', () => console.log(`Up:${port}`));
