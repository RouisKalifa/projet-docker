# ─── Stage 1 : Builder ───────────────────────────────────────────────────────
FROM node:20-alpine AS builder

WORKDIR /app

# Copie uniquement les fichiers de dépendances pour profiter du cache Docker
COPY package*.json ./
RUN npm install

# Copie le code source et compile l'application
COPY . .
RUN npm run build

# ─── Stage 2 : Image finale ──────────────────────────────────────────────────
FROM nginx:alpine

# Copie uniquement le build statique depuis le builder
COPY --from=builder /app/dist /usr/share/nginx/html

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]
