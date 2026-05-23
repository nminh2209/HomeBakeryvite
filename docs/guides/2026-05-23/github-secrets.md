# GitHub Actions secrets setup

Repository: **nminh2209/HomeBakeryvite**

## 1. Open secret settings

1. Go to https://github.com/nminh2209/HomeBakeryvite/settings/secrets/actions  
2. Click **New repository secret** for each entry below.

## 2. `FIREBASE_TOKEN` (Firestore rules deploy)

Used by `.github/workflows/deploy-firestore-rules.yml` when `firestore.rules` changes.

### Create the token (on your PC)

```bash
npm install -g firebase-tools
firebase login
firebase login:ci
```

- A browser window opens; sign in with the Google account that owns project **bakery-4c2f2**.
- The terminal prints a token like `1//0abc...`.

### Add to GitHub

| Name | Value |
|------|--------|
| `FIREBASE_TOKEN` | Paste the full token from `firebase login:ci` |

### Verify

Push a change to `firestore.rules` (or run the workflow manually under **Actions → Deploy Firestore rules → Run workflow**).

---

## 3. `E2E_ADMIN_EMAIL` and `E2E_ADMIN_PASSWORD` (Playwright in CI)

Used by CI job **E2E navigation** (`e2e/navigation.spec.ts`).

Use the same Firebase Auth admin account you use in the app (must match `firestore.rules` UID).

| Name | Value |
|------|--------|
| `E2E_ADMIN_EMAIL` | Admin email, e.g. `admin@yourdomain.com` |
| `E2E_ADMIN_PASSWORD` | That account’s password |

If these secrets are **not** set, navigation tests **skip** automatically (smoke tests still run).

### Verify locally first

```powershell
$env:E2E_ADMIN_EMAIL="your@email.com"
$env:E2E_ADMIN_PASSWORD="your-password"
npm run test:e2e -- e2e/navigation.spec.ts
```

---

## Security notes

- Never commit tokens or passwords to git.
- Rotate `E2E_ADMIN_PASSWORD` if it was shared in chat.
- `FIREBASE_TOKEN` can deploy rules only for projects your Google account can access—revoke in [Google Account security](https://myaccount.google.com/permissions) if leaked.
