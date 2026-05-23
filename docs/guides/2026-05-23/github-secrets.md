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

### Bulk import from `.env` (PowerShell only — not CMD)

From the repo root, in **PowerShell** or **Windows Terminal** (not `cmd.exe`):

```powershell
cd C:\Users\ADMIN\Documents\GitHub\HomeBakeryvite
gh auth login
powershell -ExecutionPolicy Bypass -File scripts/sync-env-to-github-secrets.ps1
```

Or from an already-open PowerShell session:

```powershell
.\scripts\sync-env-to-github-secrets.ps1
```

Each `VITE_*=...` line in `.env` becomes one GitHub secret with the same name.

---

## 4. `VITE_*` variables (CI build + optional local parity)

The app has **no config defaults in git**. Production uses Vercel env vars; **GitHub Actions build** needs the same names as repository secrets (copy values from Vercel or Firebase/Cloudinary consoles):

| Secret name | Source |
|-------------|--------|
| `VITE_FIREBASE_API_KEY` | Firebase Web app config |
| `VITE_FIREBASE_AUTH_DOMAIN` | Firebase Web app config |
| `VITE_FIREBASE_PROJECT_ID` | Firebase Web app config |
| `VITE_FIREBASE_STORAGE_BUCKET` | Firebase Web app config |
| `VITE_FIREBASE_MESSAGING_SENDER_ID` | Firebase Web app config |
| `VITE_FIREBASE_APP_ID` | Firebase Web app config |
| `VITE_FIREBASE_MEASUREMENT_ID` | Optional (Analytics) |
| `VITE_CLOUDINARY_CLOUD_NAME` | Cloudinary dashboard |
| `VITE_CLOUDINARY_UPLOAD_PRESET` | Cloudinary upload preset |
| `VITE_CLOUDINARY_FOLDER` | Cloudinary folder path |

Without these, the **Build** step in CI will fail. Vercel deploys are unaffected if variables are already set in the Vercel project.

---

## Security notes

- Never commit tokens or passwords to git.
- Rotate `E2E_ADMIN_PASSWORD` if it was shared in chat.
- `FIREBASE_TOKEN` can deploy rules only for projects your Google account can access—revoke in [Google Account security](https://myaccount.google.com/permissions) if leaked.
