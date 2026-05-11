# Mobile Project Structure

## Proposed structure (production-oriented)

```text
apps/mobile
├── app/                          # Expo Router entrypoints (routing layer only)
│   ├── (tabs)/
│   ├── _layout.tsx
│   └── modal.tsx
├── src/
│   ├── config/                   # App-level config/env
│   │   └── env.ts
│   ├── features/                 # Business features by domain
│   │   └── receipt-upload/
│   │       ├── api/
│   │       ├── components/
│   │       ├── hooks/
│   │       ├── types.ts
│   │       └── index.ts
│   ├── shared/                   # Reusable cross-feature code
│   │   ├── api/
│   │   ├── components/
│   │   ├── hooks/
│   │   ├── types/
│   │   └── utils/
│   └── modules/                  # Optional: integration modules (auth, analytics...)
├── components/                   # Existing UI base components
├── constants/
├── hooks/
├── assets/
└── scripts/
```

## Rules

- Keep `app/` thin: only routing + compose screen-level modules.
- Put feature logic into `src/features/<feature-name>/`.
- Use `src/shared/` for reusable pieces used by 2+ features.
- Keep side effects (HTTP calls, storage, analytics) in `api/` or `modules/`.
- Export each feature via `index.ts` to keep imports clean.
