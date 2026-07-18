## graphify

Knowledge graph at `graphify-out/GRAPH_REPORT.md` and `graphify-out/graph.json`.

## Architecture

**Todo** = React + TypeScript + Firebase + Wompi + DeepSeek marketplace.

### Key Collections
- `sellers`, `listings`, `transactions`, `categories`, `subscription_plans`
- Plans are dynamic from Firestore (not hardcoded)

### Cloud Functions
- `wompiWebhook` — processes payment confirmations
- `onTransactionCreate` — notifications + seller alerts

### Security Rules
- `firestore.rules` uses helpers: `isAdmin()`, `isOwner()`, `isSellerOwner()`
- `create: if false` on transactions (only via webhook)
- Pre-commit hook blocks secrets (`AIzaSy`, `sk-`, `ghp_`)

## Development Rules

1. **NO hardcoded secrets** — always use `.env` vars
2. **Pre-commit hook installed** — test with `git commit --no-verify` if blocked
3. **Tests**: `npm run test` (807 tests), `npx tsc --noEmit` (0 errors)
4. **Build**: `npm run build` (Vite + PWA)
5. **Deploy**: `firebase deploy --only hosting`
6. **New services**: add tests alongside implementation
7. **i18n**: EN/ES in `src/locales/`
