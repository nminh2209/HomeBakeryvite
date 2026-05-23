# Tiệm Bánh Vân Ngọc — Admin (HomeBakeryvite)

Vietnamese-language admin web app for a home bakery: products, orders, customers, ingredients, supply chain, billing, and dashboard analytics. Built with React, Firebase, and Ant Design.

**Production:** [home-bakeryvite.vercel.app](https://home-bakeryvite.vercel.app) (Vercel)  
**Firebase project:** `bakery-4c2f2` (Auth + Firestore; rules deployed separately)

---

## Architecture

```
Browser (Vercel CDN)
    └── Vite SPA (React + React Router)
            ├── Firebase Auth (single admin)
            ├── Firestore (data)
            └── Cloudinary (product / QR images)

Deploy:
  • Frontend → Vercel (auto on push to main)
  • Firestore rules → Firebase CLI or GitHub Action
  • CI → GitHub Actions (lint, unit tests, build, E2E)
```

Firebase Hosting is **not** used for the frontend; Vercel serves the static build.

---

## Tech stack

| Layer | Tools |
|--------|--------|
| UI | React 19, TypeScript, Ant Design 5, `@ant-design/plots` (dashboard charts) |
| Routing | React Router 7 (`/dashboard`, `/orders`, …) |
| Build | Vite 7 |
| Backend | Firebase Auth, Firestore |
| Images | Cloudinary (unsigned upload preset) |
| Tests | Vitest (unit), Playwright (E2E) |
| CI/CD | GitHub Actions, Vercel |

Node **20.x** and npm **10.9.2** (via Corepack) are pinned for consistent installs — see `packageManager` in `package.json`.

---

## Features

- **Dashboard** — collection counts, monthly revenue chart (orders + standalone bills), low-stock ingredients (`minStock` or default threshold)
- **Orders** — multi-product orders, discounts, payment status, auto-save customers by phone
- **Customers** — live list via Firestore `onSnapshot`, shared phone normalization
- **Products & categories** — Cloudinary images, generated product codes
- **Ingredients & supply** — stock levels, supply orders sync ingredient `currentStock`
- **Billing** — invoices linked to orders, print receipts
- **Suppliers & contacts** — supplier and business contact management

---

## Project structure

```
src/
├── App.tsx                 # Auth gate + BrowserRouter
├── routes.tsx              # Lazy-loaded page routes
├── layouts/AppLayout.tsx   # Sidebar + outlet
├── firebase.ts             # Firebase init (env-only, no git defaults)
├── pages/                  # Feature screens
├── types/order.ts          # Shared order types & helpers
├── utils/
│   ├── phone.ts            # Vietnamese phone normalization
│   ├── requireEnv.ts       # VITE_* validation
│   ├── dashboardStats.ts   # Revenue / low-stock logic
│   ├── supplyStock.ts      # Supply → ingredient stock deltas
│   └── cloudinaryUpload.ts
└── hooks/useFirestoreCollection.ts  # Live Firestore lists

e2e/                        # Playwright specs
docs/guides/2026-05-23/     # Ops guides (testing, secrets, backups)
.github/workflows/          # ci.yml, deploy-firestore-rules.yml
firestore.rules             # Single-admin UID lock
vercel.json                 # SPA build + rewrites
```

---

## Recent improvements (2025–2026)

| Area | What changed |
|------|----------------|
| **Security** | Firestore rules locked to one admin UID; config only via `VITE_*` (no secrets in source) |
| **Billing ↔ Orders** | Shared `order.ts` helpers; correct totals and line items on bills |
| **Config** | `requireEnv()` for Firebase/Cloudinary; `.env` gitignored |
| **UX / perf** | Lazy routes, code-split charts; Customers/Ingredients use live listeners |
| **Dashboard** | Revenue chart; low stock; no double-count for bills tied to `orderId` |
| **Quality** | Vitest unit tests; Playwright smoke + optional authenticated navigation |
| **CI/CD** | GitHub Actions + Vercel; `VITE_*` secrets for build and E2E dev server |

More notes: [docs/guides/2026-05-23/codebase-notes.md](docs/guides/2026-05-23/codebase-notes.md)

---

## Getting started

### 1. Install (match CI)

```bash
corepack enable
npm run ci:install
# or: corepack prepare npm@10.9.2 --activate && npm ci
```

### 2. Environment variables

**Required.** No defaults are committed to git.

```bash
cp .env.example .env
```

Fill every `VITE_*` in `.env` from:

- [Firebase Console](https://console.firebase.google.com/project/bakery-4c2f2/settings/general) → Web app → SDK config
- [Cloudinary Console](https://console.cloudinary.com) → upload preset settings

| Variable | Purpose |
|----------|---------|
| `VITE_FIREBASE_*` | Firebase Web client config |
| `VITE_CLOUDINARY_*` | Image uploads |

### 3. Run locally

```bash
npm run dev
```

Open http://localhost:5173 and sign in with your Firebase admin account.

---

## Scripts

| Command | Description |
|---------|-------------|
| `npm run dev` | Vite dev server |
| `npm run build` | Typecheck + production build |
| `npm run preview` | Preview `dist/` |
| `npm run test` | Vitest unit tests |
| `npm run test:e2e` | Playwright (starts dev server) |
| `npm run test:all` | test + build + e2e |
| `npm run lint` | ESLint |
| `npm run deploy:rules` | Deploy `firestore.rules` only |

---

## Deployment

### Vercel (frontend)

1. Connect repo `nminh2209/HomeBakeryvite` to Vercel.
2. Set **Node.js 20.x** in project settings.
3. Add all `VITE_*` environment variables for **Production** (same names as `.env`).
4. Push to `main` → automatic deploy.

`vercel.json` uses `npm ci` + `npm run build` and SPA rewrites.

### Firestore rules

```bash
firebase login
npm run deploy:rules
```

Or push changes to `firestore.rules` with `FIREBASE_TOKEN` set in GitHub — see [github-secrets.md](docs/guides/2026-05-23/github-secrets.md).

### Firestore backups

Scheduled backups are configured in Google Cloud / Firebase Console (may require Blaze). Guide: [firestore-backups.md](docs/guides/2026-05-23/firestore-backups.md).

---

## Testing & CI

### Unit tests (Vitest)

Covers phone normalization, order helpers, dashboard stats, supply stock logic.

```bash
npm run test
```

### E2E (Playwright)

```bash
npm run test:e2e
```

| Test file | Needs |
|-----------|--------|
| `e2e/auth.spec.ts`, `e2e/app-routes.spec.ts` | App running with **`VITE_*`** set (login smoke) |
| `e2e/navigation.spec.ts` | Above + **`E2E_ADMIN_EMAIL`** / **`E2E_ADMIN_PASSWORD`** |

Smoke failures with “Đăng nhập quản trị” not found usually mean **`VITE_*` is missing in CI**, not admin login secrets.

Full guide: [testing.md](docs/guides/2026-05-23/testing.md)

### GitHub Actions

On every push/PR to `main`:

1. **quality** — lint (core modules), Vitest, build (with `VITE_*` secrets)
2. **e2e** — Playwright smoke + optional navigation (job-level `VITE_*` + `E2E_ADMIN_*`)

Secret setup: [github-secrets.md](docs/guides/2026-05-23/github-secrets.md)

---

## Security notes

- Do not commit `.env` or service account JSON.
- `firestore.rules` allows only one Firebase Auth UID (see file for UID).
- Firebase Web `apiKey` is restricted in GCP; set HTTP referrers for Vercel and localhost.
- Rotate admin password if it was ever shared in plain text.

---

## Documentation index

| Guide | Topic |
|-------|--------|
| [testing.md](docs/guides/2026-05-23/testing.md) | Vitest, Playwright, local install |
| [github-secrets.md](docs/guides/2026-05-23/github-secrets.md) | CI secrets (`VITE_*`, `FIREBASE_TOKEN`, `E2E_ADMIN_*`) |
| [firestore-backups.md](docs/guides/2026-05-23/firestore-backups.md) | Backup / restore |
| [codebase-notes.md](docs/guides/2026-05-23/codebase-notes.md) | Known limitations & follow-ups |

---

## License

Private project — All rights reserved by the repository owner.
