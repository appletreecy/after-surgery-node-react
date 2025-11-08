# ---- build stage ----
FROM node:20-alpine AS build
WORKDIR /app

# Install deps first for better caching
COPY package*.json ./
RUN npm ci

# Copy source and build
COPY . .
# Generate once in build (ok if schema present)
RUN npx prisma generate || true
RUN npm run build

# ---- runtime stage ----
FROM node:20-alpine
WORKDIR /app

# Needed by Prisma on Alpine
RUN apk add --no-cache curl openssl libc6-compat

ENV NODE_ENV=production
ENV PORT=4000

# Bring over everything we need
COPY --from=build /app/node_modules ./node_modules
COPY --from=build /app/dist ./dist
COPY --from=build /app/prisma ./prisma
COPY --from=build /app/package*.json ./

# **CRITICAL**: (Re)generate Prisma client in the final image,
# after prisma/ and node_modules are in place.
RUN npx prisma generate

EXPOSE 4000
CMD ["node", "dist/server.js"]
