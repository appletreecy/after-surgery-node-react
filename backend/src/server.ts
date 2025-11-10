// backend/src/server.ts
import express from 'express';
import cors from 'cors';
import cookieParser from 'cookie-parser';

import authRouter from './routes/auth';
import { tableOne } from './routes/tableOne'; // ← named import matches your file
import { tableThree} from "./routes/tableThree";
import { tableFour} from "./routes/tableFour";

const app = express();
const PORT = process.env.PORT || 4000;
const NODE_ENV = process.env.NODE_ENV || 'development';

app.use(express.json());
app.use(cookieParser());

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
app.use('/table-three', tableThree); // ← mount your router here
app.use('/table-four', tableFour);

// 404 fallback
app.use((_req, res) => res.status(404).json({ error: 'Not Found' }));

app.listen(PORT, () => {
    console.log(`API running on http://localhost:${PORT} (${NODE_ENV})`);
});
