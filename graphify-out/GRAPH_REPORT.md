# GRAPH_REPORT — Todo Code Graph

## Architecture Overview

**Todo** is a React + TypeScript SPA/PWA with Firebase backend and DeepSeek AI.

## Module Map

### Services Layer
- `planService.ts` — Dynamic plans from Firestore
- `revenueService.ts` — Revenue analytics with date filtering
- `listingService.ts` — CRUD listings
- `paymentService.ts` — Wompi payment integration
- `sellerService.ts` — Seller CRUD
- `authService.ts` — Firebase Auth + roles
- `categoryService.ts` — Category tree
- `aiChatSecurity.ts` — 5-layer AI security

### Pages Layer
- `Landing.tsx` — Marketing page with dynamic pricing
- `AppHome.tsx` — Marketplace app home
- `HelpPage.tsx` — Help center (16 FAQ + guides)
- `PricingPage.tsx` — Pricing comparison
- `RevenueDashboard.tsx` — Admin revenue analytics
- `Explore.tsx` — Browse marketplace
- `Cart.tsx` — Shopping cart
- `CheckoutPage.tsx` — Payment with Wompi
- `ListingDetail.tsx` — Product/service detail
- `SellerDashboard.tsx` — Seller management
- `AdminPanel.tsx` — Admin management

### Cloud Functions
- `functions/src/index.ts` — wompiWebhook, onTransactionCreate

### Data Collections
- `sellers` — Vendor profiles
- `listings` — Products/services/digital
- `transactions` — Purchase records
- `categories` — Category tree
- `users` — User profiles with roles
- `notifications` — Push notifications

## External Dependencies
- Firebase (Auth, Firestore, Functions, Messaging, Storage)
- Wompi (Payment gateway)
- DeepSeek v4 (AI Chat)

## Security Architecture
- Firestore rules with isAdmin/isOwner/isSellerOwner helpers
- Pre-commit hook for secret detection
- CSP headers + HSTS
- 5-layer AI Chat security
- .env + .gitignore for secrets
- History cleaned with git filter-repo
