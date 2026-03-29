# CLAUDE.md

Guidance for Claude Code when working in this repository.

---

## Commands

```bash
# Development (run from repo root)
npm run dev                    # Frontend + backend concurrently
npm run dev:frontend           # Vite HMR dev server (port 5173)
npm run dev:backend            # Backend with tsx watch (port 3000)
npm run seed:admin             # Seed initial admin user

# Frontend
cd frontend && npm run build   # TypeScript check + Vite build → dist/
cd frontend && npm run lint    # ESLint

# Database (Drizzle ORM)
cd backend && npm run db:generate  # Generate migration from schema changes
cd backend && npm run db:migrate   # Apply pending migrations
cd backend && npm run db:studio    # Open Drizzle Studio (DB browser)

# Docker (production)
docker compose up --build      # Build and run all services
```

---

## Architecture

**Monorepo** (npm workspaces): `frontend`, `backend`, `shared` (shared is currently empty).

| Layer | Stack |
|---|---|
| Frontend | React 19.2, Vite 8, TypeScript 5.9, TailwindCSS 4.2, React Router 7.13 |
| Backend | Fastify 5.8, TypeScript 5.9 (NodeNext), Drizzle ORM 0.45, PostgreSQL 16 |
| Auth | Better Auth 1.5.5 (email/password, cookie sessions) |
| Email | Resend API (`backend/src/email.ts`) |
| Deployment | Dokploy + Docker Compose + Traefik + Let's Encrypt |

Both packages use ESM (`"type": "module"`). Backend compiles to CommonJS via `tsc` → `backend/dist/`.

---

## Branching Strategy

```
feature/* → dev → staging → main
```

- `feature/*` — cut from `dev`, merge back to `dev`
- `dev` — active development
- `staging` — deployed to staging server for QA before release
- `main` — production only

**Never branch from `main` or push directly to `main`.**

---

## Deployment

Dokploy manages two separate services from this repo:

| Service | Branch | Domain | Container |
|---|---|---|---|
| Production | `main` | `yeschess.school` | Nginx (port 80) |
| Staging | `staging` | `staging.yeschess.school` | Nginx (port 80) |
| Backend (prod) | `main` | `api.yeschess.school` | Fastify → Traefik port 3001 |

Nginx inside the container proxies `/api/*` → `http://backend:3000/api/`. Traefik handles HTTPS via Let's Encrypt. All services share the external `dokploy-network`.

---

## Key Files

```
backend/src/index.ts          # Main Fastify app + all routes (~2100 lines)
backend/src/auth.ts           # Better Auth config
backend/src/email.ts          # Resend email helpers
backend/src/seed-admin.ts     # Admin seeding script
backend/src/db/schema.ts      # Full Drizzle schema (~580 lines, 26 tables)
backend/src/db/index.ts       # Drizzle DB instance
frontend/src/App.tsx          # React Router setup
frontend/src/lib/auth-client.ts  # Better Auth client (useSession, signIn, etc.)
frontend/src/components/ProtectedRoute.tsx  # Auth guard
frontend/src/components/AdminLayout.tsx     # Admin sidebar layout
```

---

## Database Schema

26 tables, 13+ enums, PostgreSQL 16. Schema in `backend/src/db/schema.ts`.

**Enums:** `role` (student, parent, coach, school_owner, admin, super_admin), `plan` (free, pro, elite), `status` (active, pending, suspended), `bookingStatus`, `paymentType`, `paymentProvider`, `paymentStatus`, `subStatus`, `payoutStatus`, `tournamentStatus`, `chessTitle`, `courseLevel`, `contentType`

**Core table groups:**

| Group | Tables |
|---|---|
| Auth (Better Auth managed) | `user`, `session`, `account`, `verification` |
| Profiles | `coach_profiles`, `student_profiles` |
| Courses | `courses`, `lessons`, `course_access`, `lesson_progress` |
| Bookings | `bookings`, `coach_schedules`, `session_packages`, `purchased_packages` |
| Payments | `payments`, `subscriptions`, `payouts` |
| Tournaments | `tournaments`, `tournament_participants` |
| Parent-child | `parent_children`, `link_codes` |
| Admin/ops | `leads`, `enrollments`, `reviews` |

Key patterns:
- Soft delete via `deletedAt` timestamp (user, courses, lessons, etc.)
- `createdAt`/`updatedAt` on all business tables
- Cached aggregates: `avgRating`, `totalReviews` on `coach_profiles`
- Migrations auto-run on backend startup

---

## API Routes

Base: `/api` — all routes require cookies with `credentials: 'include'`.
Docs: `/docs` (Swagger UI, OpenAPI 3.0).

**Auth** — `/api/auth/*` handled by Better Auth:
sign-up, sign-in, sign-out, session, forgot-password, reset-password

**Coach** — `/api/coach/*`: profile CRUD, schedule, students, bookings, available slots

**Student** — `/api/student/*`: profile CRUD, assigned coach, bookings, link-code generation

**Parent** — `/api/parent/*`: profile, children list, link-child via code

**Admin** — `/api/admin/*` (admin/super_admin role required): users, approvals, stats, coaches, enrollments, soft-delete/restore/permanent-delete

**Public**: `POST /api/leads`, `GET /api/health`

Auth pattern in routes:
```ts
const session = await getSession(req)
if (!session) return reply.status(401).send({ error: 'Unauthorized' })
```

---

## Frontend Pages

`frontend/src/pages/` — 24 components, React Router in `App.tsx`.

| Path | Component | Notes |
|---|---|---|
| `/` | Home | Landing |
| `/login` | Login | |
| `/register` | Register | |
| `/forgot-password` | ForgotPassword | |
| `/reset-password` | ResetPassword | |
| `/pending` | Pending | Awaiting approval |
| `/dashboard` | Dashboard | Role-based redirect hub |
| `/student` | StudentDashboard | |
| `/student/profile/edit` | StudentProfileEdit | |
| `/student/booking` | StudentBooking | Browse & book sessions |
| `/coach` | CoachDashboard | |
| `/coach/profile` | CoachProfile | |
| `/coach/profile/edit` | CoachProfileEdit | |
| `/coach/students` | CoachStudents | |
| `/coach/schedule` | CoachSchedule | Weekly availability |
| `/coach/bookings` | CoachBookings | |
| `/parent` | ParentDashboard | |
| `/parent/add-child` | ParentAddChild | Link via code |
| `/parent/profile/edit` | ParentProfileEdit | |
| `/admin` | AdminOverview | Stats dashboard |
| `/admin/users` | AdminUsers | Soft delete, restore |
| `/admin/approvals` | AdminApprovals | Coach approval queue |
| `/admin/enrollments` | AdminEnrollments | Assign students |

---

## Environment Variables

Backend (runtime):
```
DATABASE_URL=postgresql://yeschess:{DB_PASSWORD}@db:5432/yeschess
BETTER_AUTH_SECRET=          # 32-char hex (openssl rand -hex 32)
BETTER_AUTH_URL=             # https://api.yeschess.school (prod) or http://localhost:3000
FRONTEND_URL=                # https://yeschess.school (prod) or http://localhost:5173
RESEND_API_KEY=              # Resend email service
EMAIL_FROM=YesChess <noreply@yeschess.school>
NODE_ENV=development|production
```

Frontend (build-time):
```
VITE_API_URL=                # https://api.yeschess.school (prod) or http://localhost:3000
```

Docker secrets (`DB_PASSWORD`) injected via `.env` at compose level.
