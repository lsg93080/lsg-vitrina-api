# =============================================================================
# Vitrina API — Multi-stage Dockerfile
# =============================================================================
# Stage 1 (builder): instala deps, compila TypeScript con NestJS
# Stage 2 (runtime): imagen mínima con solo el código compilado
# =============================================================================

FROM node:22-alpine AS builder

WORKDIR /usr/src/app

COPY package*.json ./
RUN npm ci

COPY . .
RUN npm run build

RUN npm prune --production

# -----------------------------------------------------------------------------

FROM node:22-alpine

ENV NODE_ENV=production
WORKDIR /usr/src/app

RUN addgroup -S appgroup && adduser -S appuser -G appgroup

COPY --from=builder /usr/src/app/dist        ./dist
COPY --from=builder /usr/src/app/node_modules ./node_modules
COPY --from=builder /usr/src/app/package.json ./package.json

RUN chown -R appuser:appgroup /usr/src/app
USER appuser

EXPOSE 3020

CMD ["node", "dist/main.js"]
