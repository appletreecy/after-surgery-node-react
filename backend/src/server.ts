import express from 'express';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import jwt from 'jsonwebtoken';

const app = express();
const PORT = process.env.PORT || 4000;
const NODE_ENV = process.env.NODE_ENV || 'development';
const JWT_SECRET = process.env.JWT_SECRET || 'replace_me';
const COOKIE_DOMAIN = process.env.COOKIE_DOMAIN || 'aftersurgerytwo.scaocoding.com';

app.use(express.json());
app.use(cookieParser());

// If dev, allow Vite; in prod we’re same-origin behind Nginx.
if (NODE_ENV === 'development') {
    app.use(cors({ origin: 'http://localhost:5173', credentials: true }));
}

// Trust proxy so secure cookies work behind Nginx/HTTPS
app.set('trust proxy', 1);

// Health
app.get('/health', (_req, res) => res.json({ ok: true }));

// ----- Helpers -----
type JWTPayload = { sub: string; email: string; name?: string };

function signToken(payload: JWTPayload) {
    return jwt.sign(payload, JWT_SECRET, { expiresIn: '7d' });
}

function verifyToken(t?: string): JWTPayload | null {
    try {
        if (!t) return null;
        return jwt.verify(t, JWT_SECRET) as JWTPayload;
    } catch {
        return null;
    }
}

function cookieOptions() {
    const base = {
        httpOnly: true as const,
        sameSite: 'none' as const, // cross-site friendly (works with HTTPS)
        secure: true as const,     // required for sameSite 'none' in browsers
        path: '/',
    };
    // Set a stable domain so subpaths all share the cookie.
    // If you deploy under a different host later, make this configurable.
    return { ...base, domain: COOKIE_DOMAIN };
}

// ----- Auth routes (no /api prefix; Nginx strips it) -----
import { Router } from 'express';
const auth = Router();

/**
 * POST /auth/login
 * Body: { email, password }
 * Replace the TODO with your real user check (Prisma).
 */
auth.post('/login', async (req, res) => {
    const { email, password } = req.body ?? {};
    // TODO: Look up user & verify password
    if (!email || !password) return res.status(400).json({ error: 'Missing credentials' });

    // Example user payload (replace with DB record)
    const user = { id: 'u1', email, name: 'Demo User' };

    const token = signToken({ sub: user.id, email: user.email, name: user.name });
    res.cookie('token', token, { ...cookieOptions(), maxAge: 7 * 24 * 3600 * 1000 });
    return res.json({ ok: true, user: { id: user.id, email: user.email, name: user.name } });
});

/**
 * GET /auth/me
 * Reads JWT from cookie and returns the user payload.
 */
auth.get('/me', (req, res) => {
    const token: string | undefined = req.cookies?.token;
    const payload = verifyToken(token);
    if (!payload) return res.status(401).json({ error: 'Unauthenticated' });
    return res.json({ user: { id: payload.sub, email: payload.email, name: payload.name ?? '' } });
});

/**
 * POST /auth/logout
 * Clears the auth cookie.
 */
auth.post('/logout', (_req, res) => {
    res.clearCookie('token', cookieOptions());
    return res.json({ ok: true });
});

app.use('/auth', auth);

// 404 fallback
app.use((_req, res) => res.status(404).json({ error: 'Not Found' }));

app.listen(PORT, () => {
    console.log(`API running on http://localhost:${PORT} (${NODE_ENV})`);
});
