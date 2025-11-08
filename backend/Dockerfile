# ---- build stage ----
FROM node:20-alpine AS build
WORKDIR /app

# Install deps first (better cache)
COPY package*.json ./
RUN npm ci

# Copy source and build
COPY . .
# Generate Prisma client (needs schema in /app/prisma)
RUN npx prisma generate || true
RUN npm run build

# ---- runtime stage ----
FROM node:20-alpine
WORKDIR /app

# For healthcheck + Prisma engine compatibility on Alpine
RUN apk add --no-cache curl openssl libc6-compat

# Environment
ENV NODE_ENV=production
ENV PORT=4000

# Bring over built app + node_modules (includes dev deps so 'npx prisma' works)
COPY --from=build /app/node_modules ./node_modules
COPY --from=build /app/dist ./dist
COPY --from=build /app/prisma ./prisma
COPY --from=build /app/package*.json ./

# (Optional) if you keep any runtime config files, copy them here too
# COPY --from=build /app/.env ./

EXPOSE 4000

# If you run behind Nginx/HTTPS and use cookies, make sure your app sets trust proxy.
# Start the server
CMD ["node", "dist/server.js"]
