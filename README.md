# ACME HR — Salary Management
Web application for HR to manage employee compensation at scale: search and maintain records, track salary changes, and view payroll analytics. Includes a seeded dataset of about 10,000 employees for realistic list and filter behavior.


## Stack

| Layer | Technologies |
|-------|----------------|
| Backend | Node.js, Express, SQLite |
| Frontend | React, Vite, TypeScript, Tailwind CSS |


## Features
- **Authentication** — JWT-based signup and login; API routes protected except health and auth.
- **Dashboard** — Headcount, payroll summaries, and charts.
- **Employees** — Search, filter, sort, paginated list; create, view, edit, and delete.
- **Salary history** — Audit trail: who changed pay, when, previous vs new amount, effective date, and reason.
- **Raise Simulator** — Preview payroll impact of a % raise (optional dept/country filters); apply when ready.
- **Salary Analytics** — Rollups by department, country, and related metrics.
- **Settings** — App and org configuration exposed in the UI.
- **Seed data** — Generates ~10,000 employees (configurable via `SEED_COUNT`).

## Prerequisites
- **Node.js** 18 or newer

## Setup
```bash
git clone <repository-url>
cd acme-salary-management
```

Copy environment templates (commit `.env.example`; never commit `.env` — it is gitignored and holds local secrets):

```bash
cp backend/.env.example backend/.env
cp frontend/.env.example frontend/.env
```

Install dependencies, migrate, seed, and run:

```bash
npm run install:all
npm run db:migrate
npm run db:seed

npm run dev:backend
npm run dev:frontend
# or: cd frontend && npm install && npm run dev
```

## URLs

| Service | URL |
|---------|-----|
| UI | http://localhost:5173 |
| API | http://localhost:4000 |
| Health check | http://localhost:4000/api/health |

## Demo credentials

From `backend/.env.example` (override in your local `backend/.env` if needed):

- **Email:** `hr@acme.example`
- **Password:** `password123`

## Scripts

| Command | Where | Purpose |
|---------|--------|---------|
| `npm run db:migrate` | root | Apply SQLite schema |
| `npm run db:seed` | root | Seed employees and demo HR user |
| `npm test` | root | Backend unit tests |
| `npm run migrate` | `backend/` | Same as `db:migrate` |
| `npm run seed` | `backend/` | Same as `db:seed` |
| `npm test` | `backend/` | Backend tests |
| `npm run dev` | `backend/` / `frontend/` | Dev server with watch (API) or Vite (UI) |

## Project layout
- **`backend/`** — Express API, SQLite migrations and seed, domain logic, tests.
- **`frontend/`** — React SPA, routing, API client, pages and components.
