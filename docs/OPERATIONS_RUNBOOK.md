# PANTRYOS — OPERATIONS & DEVELOPER RUNBOOK
**Version:** 1.0 | **Date:** 18 November 2026 | **Status:** Active

---

## 1. Quick Start Commands

```bash
# 1. Install all dependencies across workspaces
pnpm install

# 2. Build all packages and applications
pnpm run build

# 3. Run the automated test suite
pnpm run test

# 4. Start the Fastify API (Runs on http://localhost:4000)
pnpm run dev:api

# 5. Start the React 19 Vite PWA (Runs on http://localhost:3000)
pnpm run dev:web
```

---

## 2. Ports and URLs
- **Vite PWA Frontend:** `http://localhost:3000`
- **Fastify Backend API:** `http://localhost:4000`
- **WebSocket Endpoint:** `ws://localhost:4000/api/v1/ws`
- **Health Check Probe:** `http://localhost:4000/health`

---

## 3. Seeded Accounts for Testing
- **Manager:** `admin@pantryos.local`
- **Chef:** `chef@pantryos.local`
- **Cashier:** `cashier@pantryos.local`
- **Packer:** `packer@pantryos.local`
- **Table 1 QR Token:** `token_t1_98a7f`
- **Table 2 QR Token:** `token_t2_11b3c`
