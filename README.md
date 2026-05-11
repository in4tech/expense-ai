# Expense AI

Monorepo for the Expense AI app, managed with Turborepo.

## Project Structure

- `apps/mobile`: Expo React Native app (`expo-router`)
- `apps/backend`: FastAPI backend service
- `apps/packages/shared-types`: shared TypeScript types used across apps

## Prerequisites

- Node.js 18+ (recommended: latest LTS)
- npm 9+
- Python 3.12+ (for local backend run)
- Docker + Docker Compose (optional)

## Install

```bash
npm install
```

## Quick Start

Open 2 terminal windows.

Terminal 1 - start mobile app (Expo), from repo root:

```bash
npm run dev
```

Tips:

- Press `i` for iOS simulator
- Press `a` for Android emulator
- Or scan the QR code with Expo Go

Terminal 2 - run backend server:

```bash
cd apps/backend
python -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt
uvicorn app.main:app --reload
```

Backend URLs:

- API base: `http://127.0.0.1:8000`
- Health check (root): `http://127.0.0.1:8000/`

## Run With Docker

Run backend + Postgres + pgAdmin:

```bash
docker compose up --build
```

Services:

- Backend API: `http://127.0.0.1:8000`
- Postgres: `localhost:5432`
- pgAdmin: `http://127.0.0.1:5050` (`admin@example.com` / `admin`)

## Common Commands

From the repo root:

```bash
npm run dev
npm run build
npm run lint
npm run type-check
```

Mobile app shortcuts:

```bash
npm --workspace mobile run android
npm --workspace mobile run ios
npm --workspace mobile run web
```

Backend local run (without Docker):

```bash
cd apps/backend
python -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt
uvicorn app.main:app --reload
```

## Troubleshooting

If you see:

`Unable to calculate transitive closures: Workspace 'apps/mobile' not found in lockfile`

Run from repo root:

```bash
npm install
```

This refreshes `package-lock.json` with workspace entries.

## Notes

- Turborepo configuration is in `turbo.json`.
- Root `package.json` uses npm workspaces (`apps/*`, `apps/packages/*`).
- The mobile app depends on `@expense-ai/shared-types` via npm workspace linking.
- Backend entrypoint is `apps/backend/app/main.py`.
