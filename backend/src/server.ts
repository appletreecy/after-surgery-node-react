import express from 'express';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import morgan from 'morgan';
import { env } from './env';
import authRoutes from './routes/auth';
import recordRoutes from './routes/records';


const app = express();
app.use(morgan('dev'));
app.use(express.json());
app.use(cookieParser());
app.use(cors({ origin: env.corsOrigin, credentials: true }));


app.get('/health', (_, res) => res.json({ ok: true }));
app.use('/api/auth', authRoutes);
app.use('/api/records', recordRoutes);


app.listen(env.port, () => console.log(`API on http://localhost:${env.port}`));