// backend/src/server.ts
import express from 'express';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import morgan from 'morgan';   // ← added

import authRouter from './routes/auth';
import { tableOne } from './routes/tableOne';
import { tableThree } from "./routes/tableThree";
import { tableFour } from "./routes/tableFour";
import { tableFive } from "./routes/tableFive";
import { tableTwo } from "./routes/tableTwo";
import { tableJoined } from "./routes/tableJoined";

const app = express();
const PORT = process.env.PORT || 4000;
const NODE_ENV = process.env.NODE_ENV || 'development';

app.use(express.json());
app.use(cookieParser());

// =====================
// 🚀 Request Logging
// =====================
// morgan("dev") → colored concise logs for development
app.use(morgan("dev"));
// Example output:
// GET /table-one?page=1&pageSize=20 200 12.3 ms - 532
// POST /table-five 201 8.4 ms - 215

// Dev CORS only; prod is same-origin via Nginx
if (NODE_ENV === 'development') {
    app.use(cors({ origin: 'http://localhost:5173', credentials: true }));
}

// Trust proxy for secure cookies behind Nginx/HTTPS
app.set('trust proxy', 1);

// Health
app.get('/health', (_req, res) => res.json({ ok: true }));

// IMPORTANT: backend has no /api prefix (Nginx strips /api/)
app.use('/auth', authRouter);
app.use('/table-one', tableOne);
app.use('/table-two', tableTwo);
app.use('/table-three', tableThree);
app.use('/table-four', tableFour);
app.use('/table-five', tableFive);
app.use('/table-joined', tableJoined);

// 404 fallback
app.use((_req, res) => res.status(404).json({ error: 'Not Found' }));

app.listen(PORT, () => {
    console.log(`API running on http://localhost:${PORT} (${NODE_ENV})`);
});
