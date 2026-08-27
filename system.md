# EcoPlan — System Documentation

> Comprehensive reference for EcoPlan, a social platform where manufacturers share, discuss, search, save, and AI-generate low-carbon, water-saving, energy-efficient production plans that favor recycled materials.
> This document is structured so it can be used as the source of truth for generating a PowerPoint (pptx) presentation about the system.

---

## 1. Overview

| | |
|---|---|
| **Product** | EcoPlan |
| **What it is** | A social-media-style web app for sharing optimized production plans |
| **Category** | Sustainability / Manufacturing / Community / AI |
| **Core value** | Turn sustainable manufacturing know-how into shareable, searchable, AI-assisted content |
| **Domain metrics** | Every plan compares an optimized process against a conventional baseline across four metrics: CO₂ emissions, water usage, electricity, and recycled-material content |
| **Frontend** | React 19, Vite 8, React Router 7, Tailwind CSS v4, lucide-react icons, Space Grotesk display font |
| **Backend** | Node.js, Express 4, MongoDB (Mongoose 8) |
| **Auth** | Email/password + JWT (bcryptjs hashing, jsonwebtoken) |
| **AI** | OpenRouter API (default model `deepseek/deepseek-chat-v3-0324`) — structured plan generation + streaming chat (SSE) |
| **Design language** | Neumorphism — soft mint `#e4f0e8` surfaces, dual light/dark soft shadows, emerald `#059669` accent |

---

## 2. Features

1. **User authentication** — sign up, log in, JWT sessions (7-day expiry). Demo account: `demo@ecoplan.app` / `demo1234`.
2. **Feed** — all published plans, newest-first, with live **search** (title/description/product) and **product-type filter**.
3. **Plan publishing** — create, edit, and delete plans (owner-only). Each plan has: title, product type, description, materials list, step-by-step production process, and a baseline-vs-optimized metric set.
4. **Impact visualization** — color-blocked metric bars show CO₂/water/electricity reduction % and recycled-content %.
5. **Comments** — unlimited-depth threaded replies with `@mention` chips; reply to any comment or reply.
6. **Save / bookmarks** — save plans to your profile; one-click bookmark toggles on cards and detail pages.
7. **My Plans** — two tabs: "Shared by me" and "Saved".
8. **AI Assistant** (login required):
   - **Context-aware chat** — ask about any specific plan; the plan's full data is injected into the prompt, streamed live.
   - **Plan generator** — enter a product type (+ optional constraints) and get a complete, structured, metrics-backed plan draft, publishable in one click.
9. **Responsive UI** — mobile hamburger menu, stacking layouts, 90% viewport width (capped 1600px).

---

## 3. Architecture

```
┌─────────────────────────┐        HTTP /api/*        ┌──────────────────────────┐
│   React SPA (Vite)      │  ──────────────────────►  │  Express API :4000       │
│   localhost:5173        │   (dev proxy /api → 4000) │                          │
│                         │                           │  routes/                 │
│  context/AuthContext    │                           │   auth.js  plans.js      │
│  pages/ (7 screens)     │                           │   comments.js  ai.js     │
│  components/            │                           │  models/                 │
│  api/client.js          │  ──────────────────────►  │   User  Plan  Comment    │
│                         │        SSE stream         │  lib/openrouter.js       │
│  utils/metrics.js       │                           │  middleware/auth.js      │
└─────────────────────────┘                           └───────────┬──────────────┘
                                                                  │ MongoDB (Mongoose)
                                                                  ▼
                                                        mongodb://127.0.0.1:27017/ecoplan
```

- **Frontend → Backend:** Vite dev server proxies all `/api/*` calls to `http://localhost:4000` (production would use CORS).
- **Backend → AI:** `lib/openrouter.js` calls OpenRouter's `chat/completions` API with the configured key; chat streams via SSE.
- **Auth flow:** JWT stored in `localStorage`; the API client attaches it as a `Bearer` token; protected routes redirect to `/login`.

---

## 4. Data Model (MongoDB / Mongoose)

### User
| Field | Type | Notes |
|---|---|---|
| `name` | String | required |
| `email` | String | unique, lowercased |
| `passwordHash` | String | bcryptjs hash (never returned) |
| `savedPlans` | [ObjectId → Plan] | bookmarks |

### Plan
| Field | Type | Notes |
|---|---|---|
| `title` | String | max 140 |
| `productType` | String | indexed, e.g. shoes / tyres / cans / bottles |
| `description` | String | max 3000 |
| `materials` | [String] | e.g. "recycled PET yarn" |
| `steps` | [String] | ordered production steps |
| `baseline` | { co2, water, electricity, material } | conventional process |
| `optimized` | { co2, water, electricity, material } | optimized process |
| `author` | ObjectId → User | owner |
| `commentsCount` | virtual | total comments incl. replies |

Metric units: `co2` kg CO₂e/unit · `water` liters/unit · `electricity` kWh/unit · `material` % (virgin for baseline, recycled for optimized).

### Comment
| Field | Type | Notes |
|---|---|---|
| `plan` | ObjectId → Plan | indexed |
| `author` | ObjectId → User | |
| `parent` | ObjectId → Comment | null = top-level; self-referencing enables unlimited-depth threads |
| `text` | String | max 1000 |
| index | `{ plan: 1, parent: 1 }` | |

---

## 5. API Reference

Base: `http://localhost:4000/api` · Auth: `Authorization: Bearer <jwt>` · JSON bodies.

| Method | Endpoint | Auth | Description |
|---|---|---|---|
| POST | `/auth/register` | – | `{name,email,password}` → `{token,user}` |
| POST | `/auth/login` | – | `{email,password}` → `{token,user}` |
| GET | `/auth/me` | ✓ | current user + saved plans |
| GET | `/plans?q=&type=` | – | feed; search + product filter |
| GET | `/plans/saved` | ✓ | user's bookmarks |
| GET | `/plans/mine` | ✓ | user's own plans |
| GET | `/plans/types` | – | distinct product types |
| GET | `/plans/:id` | – | plan + author + all comments |
| POST | `/plans` | ✓ | create plan |
| PUT | `/plans/:id` | ✓ (owner) | edit plan |
| DELETE | `/plans/:id` | ✓ (owner) | delete plan (+ its comments) |
| POST | `/plans/:id/save` | ✓ | add bookmark |
| DELETE | `/plans/:id/save` | ✓ | remove bookmark |
| GET | `/plans/:id/comments` | – | flat comment list (client builds tree) |
| POST | `/plans/:id/comments` | ✓ | `{text, parentId?}` — unlimited nesting |
| POST | `/ai/optimize` | – | `{productType, materials?, constraints?}` → structured plan JSON |
| POST | `/ai/chat` | – | `{messages, planId?}` → SSE stream |
| GET | `/health` | – | liveness |

---

## 6. AI / LLM Integration

- **Provider:** OpenRouter (OpenAI-compatible `chat/completions`).
- **Model:** `deepseek/deepseek-chat-v3-0324` (configurable via `OPENROUTER_MODEL`).
- **`POST /api/ai/optimize`** — system prompt casts the model as "EcoPlan, expert in sustainable manufacturing"; requests a strict JSON object with `title`, `productType`, `description`, `materials`, `steps`, `baseline`, `optimized`. Response is sanitized/validated (numbers coerced, shapes enforced, lengths capped) before returning.
- **`POST /api/ai/chat`** — builds a system prompt; if `planId` is supplied, the plan's full content (title, materials, steps, both metric sets) is injected as context. The upstream stream (`stream: true`) is piped straight to the client as `text/event-stream`; the browser parses `data:` deltas and renders incrementally.
- **Fail-safe:** missing `OPENROUTER_API_KEY` returns a clear 500 error rather than crashing.

---

## 7. Frontend Screens

| Route | Page | Purpose |
|---|---|---|
| `/` | Feed | searchable, filterable plan grid |
| `/plans/:id` | PlanDetail | full plan, metric bars, materials, steps, threaded comments, save, ask-AI, edit/delete (owner) |
| `/plans/new` | CreatePlan | publish form + "Generate with AI" filler |
| `/plans/:id/edit` | CreatePlan (edit mode) | pre-filled edit form |
| `/my-plans` | MyPlans | "Shared by me" / "Saved" tabs |
| `/assistant` | Assistant | AI chat + plan generator (login required) |
| `/login` `/register` | auth | JWT auth forms |

**Shared components:** `Navbar` (responsive, hamburger on mobile), `PlanCard`, `MetricBar`, `CommentSection` (recursive threaded render), `AIChat` (streaming), `Spinner`, `RequireAuth`.

---

## 8. Design System (Neumorphism)

- **Background & surfaces:** same soft mint `#e4f0e8` for page and elements.
- **Shadows:** dual soft — light `#f7fbf8` top-left / dark `#c3d5ca` bottom-right (e.g. cards `10px 10px 24px` / `-10px -10px 24px`). Inputs use inverted (inset) shadows.
- **Accent:** emerald `#059669` (buttons, links, values); tinted surfaces `#d4ecdf` (primary buttons, product chips); muted pastels for metric tiles (amber/sky/rose/lime) and avatars.
- **Text:** primary `#33423b`, secondary `#64786c`.
- **Typography:** Space Grotesk (Google Fonts) for headings; system sans for body.
- **Interaction:** buttons collapse into inset shadows on press; cards hover with softened shadows.
- **Reusable CSS classes:** `.card`, `.btn-primary` / `.btn-dark` / `.btn-ghost` / `.btn-danger`, `.input`, `.chip`, `.neu-raised`, `.neu-inset`.

---

## 9. Getting Started

### Prerequisites
- Node.js ≥ 18, MongoDB running locally (`mongod`), an OpenRouter API key.

### Setup
```bash
# backend
cd backend
cp .env.example .env        # fill OPENROUTER_API_KEY
npm install
npm run seed                # demo user + 3 sample plans
npm run dev                 # API on :4000

# frontend (separate terminal)
cd frontend
npm install
npm run dev                 # app on :5173
```

### Environment variables (`backend/.env`)
| Var | Default | Notes |
|---|---|---|
| `PORT` | `4000` | API port (5000 may conflict) |
| `MONGO_URI` | `mongodb://127.0.0.1:27017/ecoplan` | |
| `JWT_SECRET` | — | change in production |
| `OPENROUTER_API_KEY` | — | required for AI features |
| `OPENROUTER_MODEL` | `deepseek/deepseek-chat-v3-0324` | |

### Scripts
- Backend: `npm start` · `npm run dev` (watch) · `npm run seed`
- Frontend: `npm run dev` · `npm run build` · `npm run lint` (oxlint)

### Demo login
`demo@ecoplan.app` / `demo1234`

---

## 10. Suggested Slide Deck Outline (derived from this doc)

1. **Title** — EcoPlan: share & generate greener production plans (Overview, §1)
2. **Problem** — manufacturing emissions; knowledge is siloed (§1 value statement)
3. **Solution** — social feed of four-metric production plans (§2, §4)
4. **Features** — share/search/save/comment/thread/AI (§2, §7)
5. **Demo screenshots** — Feed, PlanDetail metrics, threaded comments, AI Assistant (§7, §8)
6. **Architecture** — React SPA + Express/Mongo + OpenRouter (§3)
7. **Data model** — User / Plan / Comment, metric units (§4)
8. **API surface** — endpoint table (§5)
9. **AI integration** — optimize JSON + streaming chat (§6)
10. **Design system** — neumorphism tokens (§8)
11. **Impact & closing** — compounding adoption, AI lowers the barrier (§1, §5)