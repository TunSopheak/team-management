# LeaderSync — Team & Assignment Progress Hub

A bilingual (Khmer / English) workspace for student and project teams. Leaders create groups, add members, assign tasks with deadlines, and approve work. Members post daily standups as simple checklists and track their progress.

- **Frontend:** React 19, Vite, Tailwind CSS 4 (`client/`)
- **Backend:** Node.js, Express 5, TypeScript REST API (`server/`)
- **Database:** PostgreSQL. For local development, an embedded PostgreSQL ([PGlite](https://pglite.dev)) is used automatically, so nothing needs to be installed.
- **Auth:** email + password (bcrypt), session in an httpOnly JWT cookie, permissions enforced on the server

## Project structure

```
client/                 React app (Vite root)
  index.html
  public/               static files (favicon)
  src/
    components/         UI components (TaskBoard, DailyFeed, MembersList, modals, …)
    context/AppContext  session + data store; every action calls the API
    lib/api.ts          typed API client
    lib/dates.ts        local-time-zone date helpers
    locales/            Khmer + English strings
server/                 Express API
  index.ts              entry point (runs migrations, starts the server)
  app.ts                middleware, routes, serves the built client in production
  config.ts             environment variables
  db/                   database adapter, migrations, demo seed
  middleware/           auth + error handling
  routes/               auth, bootstrap, groups, users, tasks, dailyLogs
  services/             permissions, activity log, row mappers
shared/                 types + standup parser used by both client and server
Dockerfile, docker-compose.yml, render.yaml   deployment
```

## Run locally

Requires **Node.js 20.19+** (22 recommended).

```bash
npm install
cp .env.example .env        # optional for local dev; defaults work
npm run db:seed             # optional: load demo data (see accounts below)
npm run dev                 # API on :3000 + web on http://localhost:5173
```

Open http://localhost:5173.

- **Without seeding:** click **Create account**. The first account registered becomes the **Super Admin**.
- **With seeding:** sign in as `sopheaktun.tsp@gmail.com` (Super Admin) or `dara.pich@student.edu.kh` (member). The password for both is `password123`.

Local data is stored in `./data/pglite`. Delete that folder to start fresh.
To use a real PostgreSQL locally instead, set `DATABASE_URL` in `.env`.

## Scripts

| Command | What it does |
| --- | --- |
| `npm run dev` | API (auto-reload) + Vite dev server with `/api` proxy |
| `npm run build` | Builds the client to `dist/client` and bundles the server to `dist/server` |
| `npm start` | Runs the production server (serves the API and the built client on one port) |
| `npm run lint` | Type-checks client and server |
| `npm run db:seed` | Loads demo data into an **empty** database (dev) |
| `npm run db:seed:prod` | Same, using the built bundle (after `npm run build`) |

Database migrations run automatically every time the server starts.

## Environment variables

See [.env.example](.env.example) for the full list. These matter in production:

| Variable | Required | Notes |
| --- | --- | --- |
| `NODE_ENV` | yes | `production` |
| `DATABASE_URL` | yes | PostgreSQL connection string. If it's empty, data goes to local disk, which most hosts wipe on every redeploy. |
| `JWT_SECRET` | yes | 32+ random characters: `node -e "console.log(require('crypto').randomBytes(48).toString('hex'))"` |
| `DATABASE_SSL` | no | Defaults to on in production. Set it to `false` for Postgres servers without TLS. |
| `ALLOW_REGISTRATION` | no | `false` = only people an admin added can sign up (they claim their account) |
| `COOKIE_SECURE` | no | Set to `false` only when serving over plain HTTP |
| `PORT` | no | Most hosts set this for you |

## Deploy

The app deploys as **one Node.js service** (API + frontend on the same domain) plus **one PostgreSQL database**.

### Option A — Render (easiest, uses `render.yaml`)
1. Push this folder to a GitHub repository.
2. In Render: **New → Blueprint** and select the repo. It creates the web service and a PostgreSQL database, and generates `JWT_SECRET`.
3. Open the URL Render gives you and register. The first account becomes the Super Admin.

> Render's free Postgres expires after 30 days. Pick a paid plan, or use Option C with a free Neon/Supabase database for long-term use.

### Option B — Docker
```bash
docker compose up --build       # app + PostgreSQL on http://localhost:3000
```
For a server, build the `Dockerfile` and run it with `DATABASE_URL`, `JWT_SECRET`, and `NODE_ENV=production`. Put it behind HTTPS (e.g. Caddy or Nginx).

### Option C — Any Node host (Railway, Fly.io, a VPS, …) + hosted Postgres (Neon, Supabase, …)
```
Build command:  npm ci --include=dev && npm run build
Start command:  npm start
Health check:   /api/health
Env vars:       NODE_ENV=production, DATABASE_URL=..., JWT_SECRET=...
```

## Roles & permissions

Every rule below is enforced by the API; the UI just hides what you can't do.

| Action | Super Admin | Team Lead* | Member | Viewer |
| --- | :-: | :-: | :-: | :-: |
| Create / delete groups, add / remove members, change roles | ✅ | | | |
| Change group deadline | ✅ | group leader | | |
| Assign, reschedule, approve, delete tasks | ✅ | ✅ | | |
| Approve daily standups | ✅ | ✅ | | |
| Post standups, update own tasks & checklist | ✅ | ✅ | ✅ | |
| React, view everything in their groups, leave a group | ✅ | ✅ | ✅ | ✅ |

\* Team Lead powers apply only inside groups the person belongs to. The group's creator (leader) has them too.

**Adding members:** a Super Admin adds a person by email and student ID. If they don't have an account yet, one is created without a password. The person then clicks **Create account** and registers with the **same email and student ID** to claim it.

## API overview

All routes are under `/api` and return JSON. Everything except `/auth/*` and `/health` requires sign-in.

```
POST   /auth/register | /auth/login | /auth/logout | /auth/change-password
GET    /auth/me, /health, /bootstrap        (bootstrap = all data the user can see)
POST   /groups                     PATCH/DELETE /groups/:id
POST   /groups/:id/members         DELETE /groups/:id/members/:userId   (remove or leave)
DELETE /groups/:id/activity        PATCH  /users/:id/role
POST   /groups/:id/tasks           PATCH  /tasks/:id/status | /tasks/:id/deadline
POST   /tasks/:id/approve          DELETE /tasks/:id
POST   /groups/:id/daily-logs      DELETE /daily-logs/:id
POST   /daily-logs/:id/items/:itemId/toggle | /complete | /approve | /reactions
```
