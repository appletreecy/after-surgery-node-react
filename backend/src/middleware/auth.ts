import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { env } from '../env';


declare global {
    namespace Express {
        interface Request { user?: { id: number; email: string; name: string }; }
    }
}


export function requireAuth(req: Request, res: Response, next: NextFunction) {
    const token = req.cookies?.token;
    if (!token) return res.status(401).json({ error: 'Unauthenticated' });
    try {
        const payload = jwt.verify(token, env.jwtSecret) as any;
        req.user = { id: payload.id, email: payload.email, name: payload.name };
        next();
    } catch {
        return res.status(401).json({ error: 'Invalid token' });
    }
}