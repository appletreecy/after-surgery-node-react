import { Router } from 'express';
import { prisma } from '../lib/prisma';
import { RegisterSchema, LoginSchema } from '../schemas/auth';
import argon2 from 'argon2';
import jwt from 'jsonwebtoken';
import { env } from '../env';


const router = Router();


router.post('/register', async (req, res) => {
    const parsed = RegisterSchema.safeParse(req.body);
    if (!parsed.success) return res.status(400).json(parsed.error);
    const { email, name, password } = parsed.data;
    const exists = await prisma.user.findUnique({ where: { email } });
    if (exists) return res.status(409).json({ error: 'Email already used' });
    const hash = await argon2.hash(password);
    const user = await prisma.user.create({ data: { email, name, password: hash } });
    return res.status(201).json({ id: user.id, email: user.email, name: user.name });
});


router.post('/login', async (req, res) => {
    const parsed = LoginSchema.safeParse(req.body);
    if (!parsed.success) return res.status(400).json(parsed.error);
    const { email, password } = parsed.data;
    const user = await prisma.user.findUnique({ where: { email } });
    if (!user) return res.status(401).json({ error: 'Invalid credentials' });
    const ok = await argon2.verify(user.password, password);
    if (!ok) return res.status(401).json({ error: 'Invalid credentials' });
    const token = jwt.sign({ id: user.id, email: user.email, name: user.name }, env.jwtSecret, { expiresIn: '7d' });
    res.cookie('token', token, {
        httpOnly: true,
        sameSite: 'lax',
        secure: env.cookieSecure,
        maxAge: 7 * 24 * 60 * 60 * 1000,
    });
    return res.json({ id: user.id, email: user.email, name: user.name });
});


router.post('/logout', (req, res) => {
    res.clearCookie('token');
    res.json({ ok: true });
});


router.get('/me', (req, res) => {
    const token = req.cookies?.token;
    if (!token) return res.json({ user: null });
    try {
        const payload = jwt.verify(token, env.jwtSecret) as any;
        res.json({ user: { id: payload.id, email: payload.email, name: payload.name } });
    } catch {
        res.json({ user: null });
    }
});


export default router;