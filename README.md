# Expense AI

Monorepo for the Expense AI app, managed with Turborepo.

## Project Structure

- `apps/mobile`: Expo React Native app (`expo-router`)
- `apps/backend`: FastAPI backend service
- `apps/packages/shared-types`: shared TypeScript types used across apps

## Prerequisites

- Node.js 18+ (recommended: latest LTS)
- npm 9+

## Install

```bash
npm install
```

## Quick Start (App + Server)

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

## Development

Run all `dev` tasks through Turbo:

```bash
npm run dev
```

Run only the mobile app:

```bash
npm --workspace mobile run start
```

Run backend locally:

```bash
cd apps/backend
python -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt
uvicorn app.main:app --reload
```

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

## Notes

- Turborepo configuration is in `turbo.json`.
- The mobile app depends on `@expense-ai/shared-types` via workspace protocol.
- Backend entrypoint is `apps/backend/app/main.py`.
