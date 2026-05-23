# Firestore backups (bakery-4c2f2)

Scheduled and export backups for project **bakery-4c2f2** are configured in Google Cloud / Firebase Console, not in this repo.

## Prerequisites

- Firebase project: [bakery-4c2f2](https://console.firebase.google.com/project/bakery-4c2f2)
- **Blaze (pay-as-you-go)** billing is required for automated scheduled exports to Cloud Storage
- A **Google Cloud Storage** bucket in the same project (or linked) for backup files

## Option A — Scheduled backups (recommended)

1. Open [Firebase Console → Firestore](https://console.firebase.google.com/project/bakery-4c2f2/firestore).
2. Go to **Backups** (or **Disaster Recovery** / **Backup** tab, depending on console version).
3. Enable **scheduled backups** and choose:
   - **Frequency**: daily (typical for a small admin app)
   - **Retention**: e.g. 7–30 days
   - **Destination**: GCS bucket (create one if prompted, e.g. `gs://bakery-4c2f2-firestore-backups`)
4. Confirm billing is on **Blaze** if the UI requires it.

Backups are managed by Google; restore is done from the same Backups UI or via `gcloud` export/import workflows.

## Option B — One-time export (manual snapshot)

1. [Google Cloud Console](https://console.cloud.google.com/firestore/databases?project=bakery-4c2f2) → **Firestore** → **Import/Export**.
2. **Export** → select database → choose a GCS path (e.g. `gs://bakery-4c2f2-firestore-backups/manual/2026-05-23`).
3. Wait for the operation to finish (Operations tab).

Repeat before major data migrations or rule changes.

## Restore (high level)

1. Use Console **Import** from a previous export path, **or**
2. Follow [Firestore import/export docs](https://firebase.google.com/docs/firestore/manage-data/export-import).

Import **overwrites** existing data in targeted collections—test on a clone project first if unsure.

## Security notes

- Backup buckets should **not** be public; use IAM so only project owners can read objects.
- Firestore **security rules** in this repo (`firestore.rules`) do not apply to GCS backup files—protect the bucket separately.
- After backup setup, document the bucket name and retention in your runbook.

## Related repo commands

```bash
# Deploy security rules only (not backups)
npm run deploy:rules
```

Environment setup: see `.env.example` and README **Environment & deployment**.
