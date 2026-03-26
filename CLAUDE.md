# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

```bash
# Development
npm run dev:frontend          # Vite dev server with HMR
npm run dev:backend           # Backend dev server

# Frontend
cd frontend && npm run build  # TypeScript check + Vite build → dist/
cd frontend && npm run lint   # ESLint

# Database (Drizzle)
cd backend && npm run db:generate  # Generate migration from schema changes
cd backend && npm run db:migrate   # Apply migrations
cd backend && npm run db:studio    # Open Drizzle Studio (DB browser)

# Docker (production)
docker compose up --build     # Build and run all services
```

## Architecture

Monorepo (npm workspaces) with three packages: `frontend`, `backend`, `shared`.

- **Frontend**: React 19 + Vite 8, served by Nginx in production. SPA with catch-all routing.
- **Backend**: Fastify 5 API server on port 3000. TypeScript compiled to `dist/` (CommonJS). Drizzle ORM + PostgreSQL 16.
- **Shared**: Shared code between frontend and backend (currently empty).
- **Database**: PostgreSQL 16 (Docker container). Schema in `backend/src/db/schema.ts`, managed via Drizzle Kit.

Nginx proxies `/api/*` → `http://backend:3000/` in Docker.

## Deployment

Deployed on Dokploy via Docker Compose with Traefik reverse proxy.

- `yeschess.school` → frontend (Nginx, port 80)
- `api.yeschess.school` → backend (Fastify, port 3001 via Traefik)
- HTTPS via Let's Encrypt, services on `dokploy-network` external network

## Key Details

- Both backend and frontend use ESM (`"type": "module"`). Backend TypeScript compiled with `module: NodeNext`.
- Backend entry point: `backend/src/index.ts` → compiled to `backend/dist/index.js`
- Frontend entry point: `frontend/src/main.tsx`
- Docker build context is repo root for both services (paths in Dockerfiles are relative to root)
