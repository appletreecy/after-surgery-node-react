# backend/Dockerfile
FROM node:20-alpine AS build
WORKDIR /app

# install deps
COPY package*.json ./
RUN npm ci

# app sources (including prisma/)
COPY . .

# provide DATABASE_URL so prisma generate doesn't fail
ARG DATABASE_URL="mysql://user:pass@localhost:3306/dummy"
ENV DATABASE_URL=${DATABASE_URL}
RUN npx prisma generate

# build TS
RUN npm run build

# -- runtime image --
FROM node:20-alpine
WORKDIR /app

ENV NODE_ENV=production
# bring built app, node_modules for runtime, and prisma assets
COPY --from=build /app/dist ./dist
COPY --from=build /app/node_modules ./node_modules
COPY --from=build /app/prisma ./prisma

EXPOSE 3000
CMD ["node", "dist/server.js"]
