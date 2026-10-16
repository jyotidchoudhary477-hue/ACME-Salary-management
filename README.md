# ACME HR — Salary Management

HR web app to manage employee salaries: search and edit records, track salary changes, and view payroll analytics. Seeded with about 10,000 employees.

## Links

| | URL |
|--|-----|
| GitHub | https://github.com/jyotidchoudhary477-hue/ACME-Salary-management.git
| Frontend | https://acme-salary-management-mbxc.vercel.app/login |
| Backend health | https://acme-salary-management-backend.onrender.com/api/health |
| Backend API | https://acme-salary-management-backend.onrender.com/api |

## Stack

| Layer | Tech |
|-------|------|
| Frontend | React, Vite, TypeScript, Tailwind CSS |
| Backend | Node.js, Express, SQLite |
| Auth | JWT |
| Hosting | Vercel (frontend), Render (backend) |

## Features

- JWT signup / login
- Dashboard — headcount, payroll summaries, charts
- Employees — search, filter, sort, pagination, CRUD
- Compare — side-by-side compensation for 2–3 employees
- Salary history — previous/new amount, effective date, reason, who changed
- Raise simulator — preview % raise impact; apply when ready
- Salary analytics — by department and country
- Settings
- Seed data (~10,000 employees via `SEED_COUNT`)

## Prerequisites

- Node.js 18+
- npm

## Setup
```bash
git clone https://github.com/jyotidchoudhary477-hue/ACME-Salary-management.git
cd ACME-Salary-management

cp backend/.env.example backend/.env
cp frontend/.env.example frontend/.env

npm run install:all
npm run db:migrate
npm run db:seed

npm run dev:backend
npm run dev:frontend
```

`.env` is gitignored. Use `.env.example` as the template; do not commit real secrets.

### Local URLs

| Service | URL |
|---------|-----|
| Frontend | http://localhost:5173 |
| Backend | http://localhost:4000 |
| Health | http://localhost:4000/api/health |

### Demo login

| | |
|--|--|
| Email | `hr@acme.example` |
| Password | `password123` |

## Production env

| Where | Variable | Value |
|-------|----------|--------|
| Vercel (frontend) | `VITE_API_BASE_URL` | `https://acme-salary-management-backend.onrender.com/api` |
| Render (backend) | `CORS_ORIGIN` | `https://acme-salary-management-mbxc.vercel.app` |
| Render (backend) | `JWT_SECRET` | strong secret (not the example value) |
| Render (backend) | `NODE_VERSION` | `20.18.1` |

## Scripts

| Command | Purpose |
|---------|---------|
| `npm run install:all` | Install backend and frontend deps |
| `npm run db:migrate` | Apply SQLite schema |
| `npm run db:seed` | Seed employees and demo HR user |
| `npm run dev:backend` | Backend (watch) |
| `npm run dev:frontend` | Frontend (Vite) |
| `npm test` | Backend unit tests |

## Project layout

```text
ACME-Salary-management/
├── backend/     # Express API, SQLite, seed, tests
├── frontend/    # React SPA
├── package.json
└── README.md
```
