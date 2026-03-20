# Todo App — Conteneurisation Docker

Application de gestion de tâches full-stack conteneurisée avec Docker.
Stack : **React · Node.js · PostgreSQL · Redis · Nginx**

> Projet réalisé dans le cadre du cours "Admin Unix et conteneurs" — LP DevOps

---

## Architecture

```
                        ┌─────────────────────────────────────┐
                        │           Docker Network             │
                        │            todo_network              │
                        │                                      │
  Client (navigateur)   │   ┌─────────┐     ┌─────────────┐  │
        │               │   │         │────▶ │   frontend  │  │
        ▼               │   │         │     │  React/Vite │  │
  ┌──────────┐          │   │  nginx  │     └─────────────┘  │
  │  :80     │──────────┼──▶│ reverse │                       │
  └──────────┘          │   │  proxy  │     ┌─────────────┐  │
                        │   │         │────▶ │     api     │  │
                        │   └─────────┘     │  Node.js    │──┼──▶ PostgreSQL
                        │                   └─────────────┘  │        +
                        │                                     │      Redis
                        └─────────────────────────────────────┘
```

## Services

| Service    | Image de base      | Rôle                                      | Port interne |
|------------|--------------------|-------------------------------------------|--------------|
| `nginx`    | nginx:alpine       | Reverse proxy — point d'entrée unique     | 80 (exposé)  |
| `frontend` | node:20-alpine     | Interface React (multi-stage → nginx)     | 80           |
| `api`      | node:20-alpine     | API REST Node.js/Express (multi-stage)    | 3000         |
| `postgres` | postgres:16-alpine | Base de données relationnelle             | 5432         |
| `redis`    | redis:7-alpine     | Cache des lectures (TTL 60s)              | 6379         |

---

## Prérequis

- [Docker Desktop](https://www.docker.com/products/docker-desktop/) installé et démarré
- Git

---

## Lancement

### 1. Cloner le dépôt

```bash
git clone https://github.com/RouisKalifa/projet-docker.git
cd projet-docker
```

### 2. Créer le fichier d'environnement

**Linux / macOS :**
```bash
cp .env.example .env
```

**Windows (PowerShell) :**
```powershell
copy .env.example .env
```

> Le fichier `.env` n'est pas versionné (données sensibles). Le `.env.example` sert de modèle.
> Modifie les valeurs si nécessaire (mots de passe, ports…)

### 3. Démarrer tous les services

```bash
docker compose up --build
```

L'application est disponible sur **http://localhost**

### Arrêter les services

```bash
docker compose down
```

### Supprimer les données persistantes (volumes)

```bash
docker compose down -v
```

---

## Tester l'API avec curl

### Créer une tâche

**Linux / macOS :**
```bash
curl -X POST http://localhost/tasks \
  -H "Content-Type: application/json" \
  -d '{"title": "Ma première tâche"}'
```

**Windows (PowerShell) :**
```powershell
curl -X POST http://localhost/tasks -H "Content-Type: application/json" -d '{"title": "Ma premiere tache"}'
```

### Lister toutes les tâches

```bash
curl http://localhost/tasks
```

> La réponse indique `"source": "cache"` (Redis) ou `"source": "db"` (PostgreSQL)

### Modifier une tâche

**Linux / macOS :**
```bash
curl -X PUT http://localhost/tasks/1 \
  -H "Content-Type: application/json" \
  -d '{"done": true}'
```

**Windows (PowerShell) :**
```powershell
curl -X PUT http://localhost/tasks/1 -H "Content-Type: application/json" -d '{"done": true}'
```

### Supprimer une tâche

```bash
curl -X DELETE http://localhost/tasks/1
```

### Vérifier l'état de l'API

```bash
curl http://localhost/health
```

---

## Structure du projet

```
projet-docker/
├── .env                      # Variables d'environnement (non versionné)
├── .gitignore
├── docker-compose.yaml       # Orchestration des 5 services
│
├── api/                      # API REST Node.js
│   ├── .dockerignore
│   ├── Dockerfile            # Multi-stage build
│   ├── package.json
│   ├── index.js              # Point d'entrée + connexions DB/Redis
│   └── routes/
│       └── tasks.js          # Endpoints CRUD /tasks
│
├── frontend/                 # Interface React
│   ├── .dockerignore
│   ├── Dockerfile            # Multi-stage build (Vite → Nginx)
│   ├── package.json
│   ├── vite.config.js
│   ├── index.html
│   └── src/
│       ├── main.jsx
│       ├── App.jsx           # Composant principal (CRUD + cache indicator)
│       └── index.css
│
└── nginx/                    # Reverse proxy
    ├── Dockerfile
    └── nginx.conf            # Routing + headers de sécurité
```

---

## Points techniques notables

### Multi-stage builds
Les Dockerfiles de `api` et `frontend` utilisent un multi-stage build :
- **Stage 1 (builder)** : installe les dépendances et compile
- **Stage 2 (final)** : image légère sans outils de build

### Ordre de démarrage
```
postgres ──┐
           ├─▶ api ──┐
redis    ──┘          ├─▶ nginx
           frontend ──┘
```
`api` attend que `postgres` et `redis` soient **healthy** avant de démarrer.

### Cache Redis
- Les lectures `GET /tasks` sont mises en cache 60 secondes dans Redis
- Toute écriture (POST/PUT/DELETE) invalide le cache
- L'interface affiche la source de la donnée : ⚡ Redis ou 🗄️ PostgreSQL

### Sécurité Nginx
- `X-Frame-Options` — protection clickjacking
- `X-Content-Type-Options` — protection MIME sniffing
- `Content-Security-Policy` — restriction des sources
- `server_tokens off` — version Nginx masquée
- Le port PostgreSQL n'est pas exposé à l'extérieur

---

## Inspecter la base de données

```bash
docker exec -it todo_postgres psql -U todouser -d tododb
```

```sql
SELECT * FROM tasks;
```
