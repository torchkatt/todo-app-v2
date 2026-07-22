## graphify

Knowledge graph at `graphify-out/GRAPH_REPORT.md` and `graphify-out/graph.json`.

## Architecture

**Todo** = React + TypeScript + Firebase + Wompi + DeepSeek marketplace.

### Key Collections
- `sellers`, `listings`, `transactions`, `categories`, `subscription_plans`
- Plans are dynamic from Firestore (not hardcoded)

### Cloud Functions (`functions/src/`, organized by domain)
- `createTransaction` — callable, server-side amounts + integrity signature
- `wompiWebhook` — onRequest, mandatory checksum + idempotent + atomic (Firestore transaction)
- `verifyTransaction` — callable, server-to-server reconciliation fallback
- `aiChat` — callable, DeepSeek proxy (no API key on the client)
- `onTransactionCreate` — notifications + seller alerts
- Money is server-authoritative: the client never computes `totalAmount`. See
  `docs/PLAN-PRODUCCION.md` for the full design (checksum algorithm, idempotency key,
  state machine).

### Security Rules
- `firestore.rules` uses helpers: `isAdmin()`, `isOwner()`, `isSellerOwner()`, `hasOnly()`
- `create: if false` on transactions (only via Cloud Function)
- `sellers`/`listings` block client writes to `stats`, `isApproved`, `isFeatured` (backend-only)
- Pre-commit hook blocks secrets (`AIzaSy`, `sk-`, `ghp_`, `prv_`, private key blocks)

## Development Rules

1. **NO hardcoded secrets** — always use `.env` vars; Wompi/DeepSeek secrets live in
   Firebase Secrets / `functions/.env`, never in `VITE_*`
2. **Pre-commit hook installed** — test with `git commit --no-verify` if blocked
3. **Tests**: `npm run test` (808 tests, frontend), `npm --prefix functions test` (17 tests),
   `npm run test:rules` (Firestore/Storage rules against the emulator), `npx tsc -b` (0 errors)
4. **Build**: `npm run build` (Vite + PWA); `npm --prefix functions run build` (tsc)
5. **Deploy**: `firebase deploy --only hosting` (frontend); functions/rules deploy separately
   once Wompi credentials land (see Fase 9 in `docs/PLAN-PRODUCCION.md`)
6. **New services**: add tests alongside implementation
7. **i18n**: EN/ES in `src/locales/`
8. **CI**: `.github/workflows/ci.yml` runs secret-scan + frontend + functions + rules on every
   PR; `.github/workflows/ci-cd.yml` deploys to Hosting only after `ci.yml` passes on `master`
