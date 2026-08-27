# EcoPlan

Social platform for sustainable production plans. Engineers and factory owners share, discuss, and generate optimized production plans that use less carbon, less water, less electricity, and more recycled material.

## Features

- **Feed** — browse production plans with savings shown against a conventional baseline
- **Plan detail** — materials, step-by-step process, and a conventional-vs-optimized metrics comparison
- **Search & filter** — by product type or keyword
- **Save & threaded comments** — unlimited-depth replies with @mentions
- **AI assistant** (OpenRouter) — ask questions about any plan in context, or generate a brand-new optimized plan and publish it
- **JWT auth** — register, log in; edits and deletes restricted to owners; admin role

## Stack

- **Frontend** — React 19, Vite, Tailwind CSS, React Router
- **Backend** — Express, MongoDB (Mongoose)
- **AI** — OpenRouter LLM integration (streaming chat over SSE, structured plan generation)

## Run with Docker

```bash
docker compose up -d
docker compose run --rm backend npm run seed   # first time only
```

Open http://localhost:5173

### Demo accounts

| Role  | Email                | Password   |
|-------|----------------------|------------|
| User  | demo@ecoplan.app     | demo1234   |
| Admin | admin@ecoplan.app    | admin1234  |

### Configuration

Copy `backend/.env.example` to `backend/.env` and set `OPENROUTER_API_KEY` to enable the AI assistant.

## Run locally (no Docker)

Backend:

```bash
cd backend
npm install
npm run seed
npm run dev        # http://localhost:4000
```

Frontend (new terminal):

```bash
cd frontend
npm install
npm run dev        # http://localhost:5173
```

MongoDB must be running locally at `mongodb://127.0.0.1:27017/ecoplan` (see `backend/.env`).
