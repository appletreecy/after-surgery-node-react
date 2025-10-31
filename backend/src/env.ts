import 'dotenv/config';
export const env = {
    port: parseInt(process.env.PORT || '8080', 10),
    jwtSecret: process.env.JWT_SECRET!,
    corsOrigin: process.env.CORS_ORIGIN || 'http://localhost:5173',
    cookieSecure: process.env.COOKIE_SECURE === 'true',
};