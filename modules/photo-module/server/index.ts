import express, { Request, Response } from 'express';
import "reflect-metadata";
import cors from 'cors';
import path from 'path';
import fs from 'fs';
import { createProxyMiddleware } from 'http-proxy-middleware';
import { fileURLToPath } from 'url';
import { initDB } from './db/db';
import { createPhotosRouter } from './routes/photos';
import { createBoardsRouter } from './routes/boards';
import { createSyncRouter } from './routes/sync';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

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

app.use('/storage', express.static(storageDir));
app.use('/api/photos', createPhotosRouter(storageDir));
app.use('/api/boards', createBoardsRouter());
app.use('/api/sync', createSyncRouter());

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

initDB().then(() => {
    app.listen(port, '0.0.0.0', () => console.log(`Up:${port}`));
});
