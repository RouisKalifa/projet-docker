# ─── Stage 1 : Builder ───────────────────────────────────────────────────────
FROM node:20-alpine AS builder

WORKDIR /app

# On copie uniquement les fichiers de dépendances pour profiter du cache Docker
COPY package*.json ./
RUN npm install --omit=dev

# ─── Stage 2 : Image finale ──────────────────────────────────────────────────
FROM node:20-alpine

WORKDIR /app

# On récupère uniquement node_modules depuis le builder (pas les outils de build)
COPY --from=builder /app/node_modules ./node_modules

# On copie le code source
COPY . .

EXPOSE 3000

CMD ["node", "index.js"]
