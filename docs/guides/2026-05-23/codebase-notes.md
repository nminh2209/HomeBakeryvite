# Codebase notes

## Recently addressed

| Topic | Fix |
|--------|-----|
| Dashboard double-count | Bills with `orderId` are excluded from revenue; only standalone bills + all orders count |
| Low stock | Optional `minStock` per ingredient; dashboard uses it, else default 10 |
| Live data | `useFirestoreCollection` hook; used by Customers + Ingredients |
| Bundle size | Vite `manualChunks` splits charts / firebase / antd |
| E2E in CI | Navigation job runs when `E2E_ADMIN_*` secrets are set |

## Still to improve (optional)

### Legacy ESLint

Many pages use `any` and unused `err`. Fix over time:

```bash
npm run lint
npx eslint src/pages --fix   # auto-fix some issues
```

CI lints core modules only until the rest is cleaned up.

### More `onSnapshot` pages

Copy the pattern from `src/hooks/useFirestoreCollection.ts` (see Ingredients, Customers):

```typescript
const { items, loading } = useFirestoreCollection('orders', mapOrder);
```

Apply to Orders, Products, Supply, etc. to drop manual refresh and polling.

### Fuller E2E CRUD

Add Playwright tests that create/edit/delete test data (use a dedicated test Firebase project or cleanup in `afterEach`).

### Dashboard chart bundle

Charts load in a separate chunk (`charts-*.js`). Dashboard route stays lazy; first visit to dashboard downloads plots.

## Deployment

- **Vercel** — frontend on push to `main`
- **Firebase rules** — `deploy-firestore-rules.yml` or `npm run deploy:rules`

See [github-secrets.md](./github-secrets.md) for CI tokens.
