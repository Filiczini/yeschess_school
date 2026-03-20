# Deployment Diagram — Dokploy VPS

Обидва проєкти розгорнуті на одному VPS через **Dokploy** з **Traefik** reverse proxy.

```
                        ┌─────────────────────────────────┐
                        │           ІНТЕРНЕТ              │
                        └───────────────┬─────────────────┘
                                        │
                        ┌───────────────▼─────────────────┐
                        │     VPS (Dokploy Instance)      │
                        │                                 │
                        │  ┌───────────────────────────┐  │
                        │  │   Traefik Reverse Proxy   │  │
                        │  │   :80 (HTTP)              │  │
                        │  │   :443 (HTTPS)            │  │
                        │  │   Let's Encrypt TLS       │  │
                        │  └─────┬───────────┬─────────┘  │
                        │        │           │            │
        ┌───────────────┼────────┘           └────────┼───────────────────┐
        │               │                             │                   │
        ▼               │                             ▼                   │
 ┌────────────────┐     │                    ┌─────────────────────┐      │
 │ yeschess.school│     │                    │   buro710.com (*)  │      │
 │ + api.yeschess │     │                    │   + api.buro710    │      │
 │   .school      │     │                    │     .com (*)       │      │
 └───────┬────────┘     │                    └────────┬───────────┘      │
         │              │                             │                  │
┌────────▼───────────┐  │              ┌──────────────▼───────────────┐  │
│                    │  │              │                              │  │
│  YESCHESS SCHOOL   │  │              │  БЮРО 710                   │  │
│  (Docker Compose)  │  │              │  (Docker Compose)           │  │
│                    │  │              │                              │  │
│  ┌──────────────┐  │  │              │  ┌──────────────┐           │  │
│  │ frontend     │  │  │              │  │ frontend     │           │  │
│  │ Nginx :80    │  │  │              │  │ Nginx :80    │           │  │
│  │ React SPA    │  │  │              │  │ React SPA    │           │  │
│  │ /api/* proxy─┼──┼──┼─┐           │  │ /api/* proxy─┼──┐        │  │
│  └──────────────┘  │  │ │           │  │ /uploads/*   │  │        │  │
│                    │  │ │           │  └──────────────┘  │        │  │
│  ┌──────────────┐  │  │ │           │                    │        │  │
│  │ backend      │◄─┼──┼─┘           │  ┌──────────────┐  │        │  │
│  │ Fastify :3000│  │  │             │  │ backend      │◄─┘        │  │
│  │ Drizzle ORM  │  │  │             │  │ Express :3000│           │  │
│  └──────┬───────┘  │  │             │  │ Drizzle ORM  │           │  │
│         │          │  │             │  └──────┬───────┘           │  │
│  ┌──────▼───────┐  │  │             │         │                   │  │
│  │ db           │  │  │             │  ┌──────▼───────┐           │  │
│  │ PostgreSQL 16│  │  │             │  │ db           │           │  │
│  │ :5432        │  │  │             │  │ PostgreSQL 16│           │  │
│  └──────────────┘  │  │             │  │ :5432        │           │  │
│                    │  │             │  └──────────────┘           │  │
│  ┌──────────────┐  │  │             │                              │  │
│  │ backup       │  │  │             │  ┌──────────────┐           │  │
│  │ cron 3:00 AM │  │  │             │  │ backup       │           │  │
│  │ pg_dump daily│  │  │             │  │ cron 3:00 AM │           │  │
│  └──────────────┘  │  │             │  │ pg_dump daily│           │  │
│                    │  │             │  └──────────────┘           │  │
└────────────────────┘  │             └──────────────────────────────┘  │
                        │                                               │
                        │  ┌──────────────────────────────────────┐     │
                        │  │       dokploy-network (external)     │     │
                        │  │  Спільна Docker мережа для Traefik  │     │
                        │  └──────────────────────────────────────┘     │
                        └───────────────────────────────────────────────┘

(*) Домен Бюро налаштований через Dokploy UI, не через Traefik labels
```

## Деталі по проєктах

### YesChess School (`yeschess.school`)

| Сервіс   | Образ / Runtime      | Порт | Роутинг Traefik                     |
|----------|----------------------|------|-------------------------------------|
| frontend | Nginx Alpine         | 80   | `Host(yeschess.school)` → :80       |
| backend  | Node.js 20 Alpine    | 3001 | `Host(api.yeschess.school)` → :3001 |
| db       | PostgreSQL 16 Alpine | 5432 | БД `yeschess`, volume `pgdata`      |
| backup   | PostgreSQL 16 Alpine | —    | cron щоденний бекап о 3:00, 7 днів  |

**Маршрутизація запитів:**
- `https://yeschess.school` → Traefik → frontend (Nginx) → React SPA
- `https://yeschess.school/api/*` → Nginx proxy_pass → backend:3000
- `https://api.yeschess.school` → Traefik → backend:3001 (прямий доступ)

**Стек:** React 19 + Vite 8 / Fastify 5 + Drizzle ORM / PostgreSQL 16

**Volumes:**
- `pgdata` — дані PostgreSQL
- `backups` — бекапи БД

**Env змінні:** `DB_PASSWORD` — задається в Dokploy UI.

**Traefik labels** визначені в `docker-compose.yml` — TLS через Let's Encrypt.

---

### Бюро 710 (`buro710.com`)

| Сервіс   | Образ / Runtime      | Порт | Опис                               |
|----------|----------------------|------|------------------------------------|
| frontend | Nginx Alpine         | 80   | React SPA + proxy /api → backend   |
| backend  | Node.js 20 Alpine    | 3000 | Express 5 API, JWT + API Key auth  |
| db       | PostgreSQL 16 Alpine | 5432 | БД `buro710`, volume `pgdata`      |
| backup   | PostgreSQL 16 Alpine | —    | cron щоденний бекап о 3:00, 7 днів |

**Маршрутизація запитів:**
- `https://buro710.com` → Traefik → frontend (Nginx) → React SPA
- `https://buro710.com/api/*` → Nginx proxy_pass → backend:3000
- Прямий доступ до API через окремий субдомен (налаштований в Dokploy UI)

**Стек:** React 19 + Vite + Tailwind 4 / Express 5 + Drizzle ORM / PostgreSQL 16

**Volumes:**
- `pgdata` — дані PostgreSQL
- `uploads` — завантажені файли (backend rw, nginx ro)
- `backups` — бекапи БД

**Env змінні:** `DB_PASSWORD`, `JWT_SECRET`, `FRONTEND_URL`, `API_KEY`, `TELEGRAM_BOT_TOKEN`, `TELEGRAM_CHAT_ID` — задаються в Dokploy UI.

---

## Спільна інфраструктура

| Компонент           | Деталі                                         |
|---------------------|-------------------------------------------------|
| **Dokploy**         | Оркестрація, CI/CD, управління контейнерами     |
| **Traefik**         | Reverse proxy, TLS termination, routing         |
| **Let's Encrypt**   | Автоматичні SSL сертифікати                     |
| **dokploy-network** | Зовнішня Docker мережа, з'єднує всі сервіси з Traefik |

Обидва проєкти підключені до `dokploy-network` (external: true), через яку Traefik маршрутизує трафік до відповідних контейнерів.
