# ---- build stage ----
FROM node:20-alpine AS build
WORKDIR /app

# Install deps first for better caching
COPY package*.json ./
RUN npm ci

# Copy source
COPY . .

# Prisma needs a DATABASE_URL at generate time, but it doesn't actually connect.
# So we give it a dummy value just to satisfy the config.
ENV DATABASE_URL="mysql://user:password@localhost:3306/dummy"

# Generate Prisma client (must succeed)
RUN npx prisma generate

# Build TypeScript
RUN npm run build

# ---- runtime stage ----
FROM node:20-alpine
WORKDIR /app

# Needed by Prisma on Alpine
RUN apk add --no-cache curl openssl libc6-compat

ENV NODE_ENV=production
ENV PORT=4000

# Copy built artifacts and dependencies from build stage
COPY --from=build /app/node_modules ./node_modules
COPY --from=build /app/dist ./dist
COPY --from=build /app/prisma ./prisma
COPY --from=build /app/package*.json ./

# At runtime you should pass the *real* DATABASE_URL via env
# (docker run -e DATABASE_URL=..., docker-compose, K8s, etc.)

EXPOSE 4000
CMD ["node", "dist/server.js"]
