# syntax=docker/dockerfile:1.7

# ─── deps (full, for build) ──────────────────────────────────────────
FROM node:20-alpine AS deps
WORKDIR /app
RUN apk add --no-cache libc6-compat
COPY package.json package-lock.json ./
RUN npm ci

# ─── prod-deps (slim, for runtime scripts) ───────────────────────────
FROM node:20-alpine AS prod-deps
WORKDIR /app
RUN apk add --no-cache libc6-compat
COPY package.json package-lock.json ./
RUN npm ci --omit=dev

# ─── build ───────────────────────────────────────────────────────────
FROM node:20-alpine AS builder
WORKDIR /app
RUN apk add --no-cache libc6-compat
COPY --from=deps /app/node_modules ./node_modules
COPY . .
ENV NEXT_TELEMETRY_DISABLED=1
RUN npm run build

# ─── runner ──────────────────────────────────────────────────────────
FROM node:20-alpine AS runner
WORKDIR /app
ENV NODE_ENV=production \
    NEXT_TELEMETRY_DISABLED=1 \
    PORT=3000 \
    HOSTNAME=0.0.0.0 \
    UPLOADS_DIR=/app/public/uploads

RUN apk add --no-cache libc6-compat \
 && addgroup -g 1001 -S nodejs \
 && adduser -S nextjs -u 1001 -G nodejs

# Next standalone server bundle (minimal node_modules + server.js).
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static
COPY --from=builder --chown=nextjs:nodejs /app/public ./public

# Overlay full prod node_modules so our standalone migrate/seed scripts
# can `import 'pg'`, `import 'drizzle-orm'`, etc.
COPY --from=prod-deps --chown=nextjs:nodejs /app/node_modules ./node_modules

# Migration files + helper scripts + seed data
COPY --from=builder --chown=nextjs:nodejs /app/scripts ./scripts
COPY --from=builder --chown=nextjs:nodejs /app/drizzle ./drizzle
COPY --from=builder --chown=nextjs:nodejs /app/data ./data

# Pre-create uploads dir so a mounted volume picks up correct ownership.
RUN mkdir -p /app/public/uploads && chown -R nextjs:nodejs /app/public/uploads

USER nextjs
EXPOSE 3000

# Migrate (idempotent), then start the server.
# Seed scripts (scripts/seed-admin.mjs, scripts/seed.mjs) are one-shots — run manually inside the container when needed.
CMD ["sh", "-c", "node scripts/migrate.mjs && node server.js"]
