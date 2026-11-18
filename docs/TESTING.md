# PANTRYOS — TESTING STRATEGY & REAL EXECUTION EVIDENCE
**Version:** 1.0 | **Date:** 18 November 2026 | **Status:** All Tests Passing (15/15)

---

## 1. Test Architecture
Testing in PantryOS is structured into three layers:
1. **Pure Business Domain Unit Tests (`packages/business-rules`):**
   - Decimal-safe money arithmetic in paise & 5% GST calculations
   - Metric unit conversions (kg to g, L to ml)
   - Cooked batch portion derivation ($\lfloor Usable\_Yield / Portion\_Size \rfloor$)
   - Exclusive stove lock conflict detection
   - Finite state machine transition guards
2. **Fastify API Integration Tests (`apps/api`):**
   - HTTP route validation using Fastify's native `app.inject()`
   - Health check probe (`GET /health`)
   - Staff login & session cookie (`POST /api/v1/auth/login`)
   - Table QR opaque token verification (`POST /api/v1/auth/table-session`)
   - Dynamic portion availability (`GET /api/v1/menu`)
   - Concurrent stove lock conflict rejection (`POST /api/v1/equipment/acquire-lock` $\rightarrow$ 409 Conflict)
   - Order placement & atomic portion depletion (`POST /api/v1/orders`)
   - Payment settlement (`POST /api/v1/payments`)
3. **PWA Build & Asset Verification (`apps/web`):**
   - React 19 + TypeScript build with Vite
   - Service Worker generation (`dist/sw.js`)
   - Pre-caching manifest with 12 static assets

---

## 2. Real Execution Evidence (Captured from Terminal)

### Test Run: `pnpm run test`
```bash
$ vitest run

 RUN  v2.1.9 /home/5296658037_0/.gemini/antigravity/scratch/pantry-os

 ✓ packages/business-rules/src/index.test.ts (9)
   ✓ Business Rules - Money & GST (3)
     ✓ formats INR correctly from paise
     ✓ calculates 5% GST correctly on food items
     ✓ calculates order totals with packaging and discount
   ✓ Business Rules - Unit Conversions (1)
     ✓ converts kg to g and l to ml
   ✓ Business Rules - Batch Portions (2)
     ✓ calculates portions from actual usable yield correctly
     ✓ tracks remaining and reserved portions without double counting
   ✓ Business Rules - Stove Lock & Capacity (1)
     ✓ prevents overlapping exclusive equipment assignment
   ✓ Business Rules - State Machines (2)
     ✓ validates allowed order transitions
     ✓ validates allowed batch transitions
 ✓ apps/api/src/server.test.ts (6)
   ✓ PantryOS Fastify API Integration Tests (6)
     ✓ GET /health returns healthy status
     ✓ POST /api/v1/auth/login validates credentials
     ✓ POST /api/v1/auth/table-session validates table QR token
     ✓ GET /api/v1/menu returns dynamic dish availability
     ✓ POST /api/v1/equipment/acquire-lock enforces exclusive lock
     ✓ POST /api/v1/orders places order and atomically reserves batch portions

 Test Files  2 passed (2)
      Tests  15 passed (15)
   Duration  1.71s
```

### Build Run: `pnpm --filter @pantryos/web run build`
```bash
$ tsc && vite build
vite v6.4.6 building for production...
✓ 2148 modules transformed.
dist/registerSW.js               0.13 kB
dist/manifest.webmanifest        0.48 kB
dist/index.html                  1.48 kB │ gzip:  0.72 kB
dist/assets/index-C1inhRId.js  287.63 kB │ gzip: 84.74 kB
✓ built in 3.82s

PWA v0.21.2
mode      generateSW
precache  12 entries (286.31 KiB)
files generated
  dist/sw.js
  dist/workbox-9c191d2f.js
```
