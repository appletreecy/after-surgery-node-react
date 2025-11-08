import express from 'express';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import authRouter from './routes/auth'; // ← use your real router

const app = express();
const PORT = process.env.PORT || 4000;
const NODE_ENV = process.env.NODE_ENV || 'development';

app.use(express.json());
app.use(cookieParser());

// Dev CORS only (prod is same-origin via Nginx)
if (NODE_ENV === 'development') {
    app.use(cors({ origin: 'http://localhost:5173', credentials: true }));
}

// Behind Nginx/HTTPS
app.set('trust proxy', 1);

// Health for Docker healthcheck
app.get('/health', (_req, res) => res.json({ ok: true }));

// IMPORTANT: mount WITHOUT /api (Nginx strips /api/)
app.use('/auth', authRouter);

// 404 fallback
app.use((_req, res) => res.status(404).json({ error: 'Not Found' }));

app.listen(PORT, () => {
    console.log(`API running on http://localhost:${PORT} (${NODE_ENV})`);
});
