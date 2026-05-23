# Testing guide

## Install (match CI / Vercel)

- **Node 20** — `.nvmrc` and `"engines": { "node": "20.x" }` (Vercel + GitHub Actions)
- **npm 10.9.2** — recommended via Corepack for lockfile consistency (not enforced in `engines`)

```bash
corepack enable
npm run ci:install
```

After changing dependencies, regenerate the lock with npm 10: `npx npm@10.9.2 install`, then commit `package-lock.json`.

## Unit tests (Vitest)

```bash
npm run test          # single run
npm run test:watch    # watch mode
npm run test:coverage # coverage report
```

Covers:

- `src/utils/phone.ts` — Vietnamese phone normalization
- `src/types/order.ts` — order totals, line items, billing mapping
- `src/utils/dashboardStats.ts` — revenue by month, low stock
- `src/utils/supplyStock.ts` — supply → ingredient stock deltas (Firestore mocked)

## E2E tests (Playwright)

```bash
npm run test:e2e      # starts dev server, runs e2e/
npm run test:e2e:ui   # interactive UI mode
```

### Without credentials

Runs:

- Login form visible
- Invalid login shows error
- Deep links show login when logged out

### With admin credentials (full app flow)

Set locally or in GitHub Actions secrets:

| Variable | Purpose |
|----------|---------|
| `E2E_ADMIN_EMAIL` | Firebase Auth admin email |
| `E2E_ADMIN_PASSWORD` | Admin password |

```bash
# PowerShell
$env:E2E_ADMIN_EMAIL="admin@example.com"
$env:E2E_ADMIN_PASSWORD="your-password"
npm run test:e2e
```

Authenticated suite (`e2e/navigation.spec.ts`) visits dashboard, orders, customers, products, billing.

## CI

- **`.github/workflows/ci.yml`** — lint, unit tests, build, E2E smoke on every push/PR
- **`.github/workflows/deploy-firestore-rules.yml`** — deploy rules when `firestore.rules` changes (needs `FIREBASE_TOKEN` secret)

Vercel deploys the frontend on push to `main`; no Firebase Hosting CI required.

Step-by-step secret setup: [github-secrets.md](./github-secrets.md).

## Getting a Firebase CI token

```bash
firebase login:ci
```

Add the token to GitHub → Settings → Secrets → `FIREBASE_TOKEN`.
