import express from 'express';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import path from 'path';

const app = express();
const PORT = process.env.PORT || 4000;
const NODE_ENV = process.env.NODE_ENV || 'development';

// ─────────────────────────────────────────────
// Middleware
// ─────────────────────────────────────────────
app.use(express.json());
app.use(cookieParser());

// CORS:
// - In dev: allow Vite (localhost:5173)
// - In prod: allow your domain (or disable completely if same-origin via Nginx)
if (NODE_ENV === 'development') {
    app.use(
        cors({
            origin: 'http://localhost:5173',
            credentials: true,
        })
    );
} else {
    // same-origin; Nginx proxies /api so browser sees same host
    app.use(
        cors({
            origin: 'https://aftersurgerytwo.scaocoding.com',
            credentials: true,
        })
    );
}

// If behind Nginx + HTTPS and using cookies/sessions
app.set('trust proxy', 1);

// ─────────────────────────────────────────────
// Health check
// ─────────────────────────────────────────────
app.get('/health', (_req, res) => {
    res.json({ ok: true });
});

// ─────────────────────────────────────────────
// Auth routes
// ─────────────────────────────────────────────
import { Router } from 'express';
const auth = Router();

// Example handlers — replace with your real logic
auth.get('/me', (req, res) => {
    res.json({ message: 'User info (mock)', user: null });
});

auth.post('/register', (req, res) => {
    const body = req.body;
    // TODO: insert into DB with Prisma
    res.json({ message: 'User registered', data: body });
});

auth.post('/login', (req, res) => {
    // TODO: verify credentials, issue JWT / cookie
    res.json({ message: 'Logged in' });
});

// Mount without `/api` prefix (Nginx strips /api/)
app.use('/auth', auth);

// ─────────────────────────────────────────────
// 404 fallback
// ─────────────────────────────────────────────
app.use((_req, res) => {
    res.status(404).json({ error: 'Not Found' });
});

// ─────────────────────────────────────────────
// Start server
// ─────────────────────────────────────────────
app.listen(PORT, () => {
    console.log(`API running on http://localhost:${PORT} (${NODE_ENV})`);
});
