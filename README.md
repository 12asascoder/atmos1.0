# 

🌍 MODULE 1: Global Competitor Ad Surveillance Engine

## 🏗 Root Project Structure
snitch-marketing-os/
├── frontend/        # Next.js / React app (dashboard)
├── backend/         # API, database, queues, scrapers
├── docker/          # (optional) Docker configs
├── scripts/         # helper scripts (seed, deploy, etc.)
├── .env             # root env (or .env.local)
├── package.json
└── README.md


## 🎨 frontend/ – UI for dashboard
frontend/
├── public/                  # static assets (logos, icons, fonts)
├── src/
│   ├── app/ or pages/       # Next.js routes (depends on version)
│   │   ├── layout.tsx
│   │   ├── page.tsx         # main dashboard
│   │   ├── competitors/
│   │   │   ├── page.tsx     # list competitors
│   │   │   └── [id]/        # competitor detail
│   │   │       └── page.tsx # ads, metrics
│   │   ├── ads/
│   │   │   └── page.tsx     # global ad feed
│   │   ├── alerts/
│   │   │   └── page.tsx     # alerts feed
│   │   └── auth/            # login/signup if needed
│   │
│   ├── components/          # reusable UI components
│   │   ├── layout/
│   │   │   ├── Sidebar.tsx
│   │   │   ├── Topbar.tsx
│   │   │   └── Card.tsx
│   │   ├── charts/
│   │   │   ├── PlatformDistributionChart.tsx
│   │   │   └── SpendTrendChart.tsx
│   │   ├── competitors/
│   │   │   ├── CompetitorCard.tsx
│   │   │   └── CompetitorForm.tsx
│   │   ├── ads/
│   │   │   ├── AdCard.tsx
│   │   │   └── AdFilters.tsx
│   │   └── alerts/
│   │       └── AlertList.tsx
│   │
│   ├── features/            # logic grouped by feature
│   │   ├── competitors/
│   │   │   ├── api.ts       # calls backend /competitors
│   │   │   ├── hooks.ts     # useCompetitors(), etc.
│   │   │   └── types.ts
│   │   ├── ads/
│   │   │   ├── api.ts       # /ads endpoints
│   │   │   ├── hooks.ts
│   │   │   └── types.ts
│   │   ├── alerts/
│   │   │   ├── api.ts
│   │   │   ├── hooks.ts
│   │   │   └── types.ts
│   │   └── auth/
│   │       └── ...
│   │
│   ├── lib/
│   │   ├── axiosClient.ts   # API client config
│   │   ├── config.ts        # base URLs, constants
│   │   └── utils.ts         # small helpers
│   │
│   ├── styles/
│   │   └── globals.css
│   └── types/
│       └── global.ts
│
├── .env.local
├── package.json
└── tsconfig.json


## ⚙️ backend/ – API, DB, Jobs, Scrapers

backend/
├── app/
│   ├── main.py               # FastAPI app entrypoint
│   ├── core/                 # core config & setup
│   │   ├── config.py         # settings (env vars)
│   │   ├── database.py       # DB engine & session
│   │   ├── logging.py        # logging config
│   │   └── security.py       # (if you add auth later)
│   │
│   ├── models/               # SQLAlchemy / SQLModel tables
│   │   ├── user.py
│   │   ├── competitor.py     # competitors table
│   │   ├── ad.py             # competitor_ads table
│   │   └── spend.py          # spend_estimates table
│   │
│   ├── schemas/              # Pydantic models (request/response)
│   │   ├── user.py
│   │   ├── competitor.py
│   │   ├── ad.py
│   │   └── spend.py
│   │
│   ├── api/                  # API routers
│   │   ├── deps.py           # common dependencies (DB session, auth)
│   │   └── v1/
│   │       ├── router.py     # include all v1 routes
│   │       ├── competitors.py  # /competitors
│   │       ├── ads.py          # /ads
│   │       ├── summary.py      # /competitors/summary (cards)
│   │       ├── alerts.py       # /alerts
│   │       └── health.py       # /health
│   │
│   ├── services/             # business logic (no FastAPI stuff)
│   │   ├── competitor_service.py
│   │   ├── ad_service.py         # active ads, filters
│   │   ├── spend_service.py      # estimated spend + distribution
│   │   └── alert_service.py      # alert rules
│   │
│   ├── workers/              # background processes (Celery/RQ)
│   │   ├── __init__.py
│   │   ├── scraping/
│   │   │   ├── meta_worker.py    # Meta Ad Library fetch
│   │   │   ├── google_worker.py  # Google ad fetch
│   │   │   ├── tiktok_worker.py  # (scraper)
│   │   │   └── common.py         # shared helpers
│   │   ├── landing_page_worker.py # screenshots + HTML
│   │   └── alert_worker.py       # weekly/daily checks for surges etc.
│   │
│   ├── integrations/         # external APIs & scraping
│   │   ├── meta_client.py    # low-level Meta Ad Library client
│   │   ├── google_client.py
│   │   └── http_client.py    # shared HTTP wrapper (httpx/requests)
│   │
│   ├── scraping/             # Playwright/selenium logic if you want separated
│   │   ├── meta_scraper.py
│   │   ├── google_scraper.py
│   │   └── tiktok_scraper.py
│   │
│   ├── storage/              # S3 or similar
│   │   ├── s3_client.py
│   │   └── file_service.py
│   │
│   └── utils/                # small tools
│       ├── hashing.py        # landing page hash for redesign detection
│       ├── time.py
│       └── cpm_tables.py     # CPM constants for spend estimation
│
├── migrations/               # Alembic migrations
├── tests/
│   ├── test_competitors.py
│   └── test_ads.py
├── requirements.txt / pyproject.toml
└── .env.example



## We’ll make competitor management work end‑to‑end:

POST /api/v1/competitors → add competitor

GET /api/v1/competitors → list competitors

DELETE /api/v1/competitors/{id} → delete competitor

Stack: FastAPI + SQLAlchemy + Postgres (Supabase)

## app/core/config.py - Read your DB connection string from .env so you don’t hardcode passwords.

## app/core/database.py
👉 Simple idea:

engine = connection to database

SessionLocal = “open a tab” to DB

Base = parent for all DB models

get_db() = FastAPI’s way to give you a DB session inside your endpoints.

## app/models/competitor.py -  DB table model
👉 Simple idea:
This class = one row in competitors table.
Fields match what we discussed: domain, brand name, social handles, etc.

## app/schemas/competitor.py – Request/Response shapes
👉 Simple idea:

CompetitorCreate = data your frontend sends when adding a competitor

CompetitorResponse = data your API sends back

Keeps request/responses clean and typed.

## app/services/competitor_service.py – business logic

👉 Simple idea:
These functions are your “logic layer”:

create_competitor – puts a new competitor row into DB

list_competitors – returns all competitors (optionally filtered by user)

delete_competitor – removes a competitor row

## app/api/v1/competitors.py – FastAPI endpoints
👉 Simple idea in words:

POST /competitors

Input: JSON with name, domain, social_handles…

Uses create_competitor → saves in DB → returns the saved row.

GET /competitors

Reads from DB → returns list of competitors.

DELETE /competitors/{id}

Looks for competitor in DB

If exists → delete

If not → send 404 error.

## app/api/v1/router.py – main API router

👉 Simple idea:
This collects all v1 endpoints in one place. Later you’ll add ads, summary, alerts routers here too.

## app/main.py – FastAPI app entry
👉 Simple idea:

Creates FastAPI app

Makes sure tables exist (dev mode)

Adds CORS so your frontend can call it

Mounts all v1 endpoints under /api/v1

Gives you a test root / endpoint.

## 