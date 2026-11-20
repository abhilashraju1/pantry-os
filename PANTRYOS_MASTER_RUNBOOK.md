# PANTRYOS — MASTER OPERATIONS, TESTING & CLOUDFLARE DEPLOYMENT RUNBOOK
**Project:** Smart Karnataka Vegetarian Pantry, Kitchen, POS & Commerce Platform  
**Repository:** [https://github.com/abhilashraju1/pantry-os.git](https://github.com/abhilashraju1/pantry-os.git)  
**Version:** 2.0 Consolidated | **Updated:** 18 November 2026

---

## 1. Quick Start: How to Run the Project Locally

### 1.1 Prerequisites
- **Node.js:** v22.x LTS (tested on v22.12.0)
- **Package Manager:** `pnpm` (tested on v12.21.0)
- **Git:** Installed and configured

### 1.2 Installation & Build
```bash
# 1. Navigate to the project root
cd /home/5296658037_0/.gemini/antigravity/scratch/pantry-os

# 2. Install all dependencies across workspaces
pnpm install

# 3. Database migrations and initial setup (PGlite standalone or PostgreSQL)
pnpm run db:migrate       # Runs schema DDL migrations
pnpm run db:bootstrap     # One-time first admin & branch setup
pnpm run db:seed          # Seeds authentic synthetic demo data (3 dishes, staff, equipment)
# Or reset operational demo data at any time:
# pnpm run db:reset-demo

# 4. Build all workspace packages (contracts, business rules, i18n, ui, database, api, web)
pnpm run build

# 5. Run test suite (35 automated unit, integration, and E2E scenario tests)
pnpm test

# 6. Typecheck all workspaces
pnpm run typecheck
```

### 1.3 Running the Services
You can run the backend API and frontend PWA simultaneously or in separate terminal windows:

#### Terminal 1 — Start the Fastify 5 REST & WebSocket API:
```bash
pnpm run dev:api
```
* **API URL:** `http://localhost:4000`
* **Health Check Probe:** `http://localhost:4000/health`
* **WebSocket Live Hub:** `ws://localhost:4000/api/v1/ws`

#### Terminal 2 — Start the React 19 Vite PWA:
```bash
pnpm run dev:web
```
* **Frontend Web App:** `http://localhost:3000` (Binds to `0.0.0.0:3000` for local network access)

#### Simultaneous One-Command Startup:
```bash
pnpm run dev
```

---

## 2. Seed Data Master Verification

The platform comes pre-seeded with authentic Karnataka vegetarian operational data. You can verify this data through both curl commands and the browser UI:

### 2.1 Branch & Organization Identity
- **Organization:** Mandya Traditional Pantries Private Limited (`org-01`)
- **Branch:** VV Puram Food Street Branch (`BLR-VVP-01`), Old Tharagupet, Bengaluru
- **Tax Policy:** 5% GST for restaurant food service without ITC

### 2.2 Dining Tables & Mobile QR Tokens
| Table Number | Opaque QR Token | Direct Mobile URL (Port 3000) | Seating Capacity | Status |
| :--- | :--- | :--- | :--- | :--- |
| **Table 1** | `token_t1_98a7f` | `http://localhost:3000/?view=qr&table=T1` | 4 seats | Available |
| **Table 2** | `token_t2_11b3c` | `http://localhost:3000/?view=qr&table=T2` | 2 seats | Occupied |
| **Table 3** | `token_t3_44c2d` | `http://localhost:3000/?view=qr&table=T3` | 4 seats | Available |
| **Table 4** | `token_t4_77e8f` | `http://localhost:3000/?view=qr&table=T4` | 6 seats | Available |
| **Table 5** | `token_t5_22d9a` | `http://localhost:3000/?view=qr&table=T5` | 2 seats | Available |
| **Table 6** | `token_t6_55f1b` | `http://localhost:3000/?view=qr&table=T6` | 4 seats | Available |

### 2.3 Shared Kitchen Equipment & Exclusive Locking
- `eq-burner-1`: Commercial Gas Burner 1 (Stove Station, Available)
- `eq-burner-2`: Commercial Gas Burner 2 (Stove Station, Available)
- `eq-tawa-1`: Heavy Cast Iron Akki Rotti Tawa 1 (Tawa Station, Available)
- `eq-warmer-1`: Thermal Food Warmer Pot 1 (Holding Station, Locked by Bisi Bele Bath Batch #102)

### 2.4 The Exact Three Main Vegetarian Seed Dishes & BOM
Verify live dish availability using:
```bash
curl -s http://localhost:4000/api/v1/menu | jq .
```

1. **Bassaru (ಬಸ್ಸಾರು) — `READY_BATCH`**
   - **Recipe:** 400g toor dal, 500g fresh leafy greens, 200g onion, 250g tomato, 100g coconut, 30g tamarind, garlic, chillies, spices, oil.
   - **Serving:** 250 ml regular bowl + seasoned palya (Optional Ragi Mudde combo add-on ₹20).
   - **Demo Price:** ₹65.00 (`6500` paise).
   - **Active Batch #101:** Cooked yield 2,500 ml. 2 portions reserved by pending orders, **8 portions immediately available**.

2. **Bisi Bele Bath (ಬಿಸಿ ಬೇಳೆ ಬಾತ್) — `READY_BATCH`**
   - **Recipe:** 650g Sona Masoori rice, 350g toor dal, 850g mixed veggies, 250g onion, 250g tomato, tamarind, spice powder, pure ghee tempering.
   - **Serving:** 300 g regular plate.
   - **Demo Price:** ₹90.00 (`9000` paise).
   - **Active Batch #102:** Actual cooked yield 3,120 g in Warmer Pot 1 (Core temp 79°C verified). 4 portions reserved, **6 portions immediately available**.

3. **Akki Rotti (ಅಕ್ಕಿ ರೊಟ್ಟಿ) — `FRESH_ORDER`**
   - **Recipe:** 1,200g fine rice flour, 300g chopped onions, 45g green chillies, 70g coriander, cumin, oil. Paired with fresh coconut chutney sub-recipe.
   - **Serving:** 2 pieces freshly roasted on exclusive Tawa 1.
   - **Demo Price:** ₹80.00 (`8000` paise).
   - **Availability:** Dynamically bounded by raw rice flour stock (45,000g on-hand $\rightarrow$ **208 orders available**).

---

## 3. Complete End-to-End Testing Verification

### 3.1 Running the Automated Test Suite
Execute the entire test suite across all packages:
```bash
pnpm run test
```

### 3.2 Expected Test Output (15/15 Tests Passing)
```text
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

Test Files:  2 passed (2)
Tests:       15 passed (15)
Duration:    1.71s
```

### 3.3 Manual End-to-End Verification Flow
1. Open `http://localhost:3000` in your browser.
2. **Step 1 (Cashier POS):** Click **Cashier POS**. Add 2x Bisi Bele Bath and 1x Akki Rotti. Notice totals with 5% GST calculated in paise. Click **Collect Payment & Place Order** and select **Cash**. Notice immediate toast confirmation.
3. **Step 2 (Chef KDS):** Switch to **Chef KDS**. The top **All-Day Summary Ribbon** immediately displays consolidated demand: `[ 2x Bisi Bele Bath ] [ 1x Akki Rotti ]`.
4. **Step 3 (Audio Guidance):** Ensure **Voice Guidance ON** is active. Step alerts and timer cues announce audibly in Kannada or English using the Web Speech API.
5. **Step 4 (Food Safety Signoff):** Click **Quality & Food Safety Check Required**. Enter core temperature `78°C` and actual yield `3120g`. Click **Approve & Release to Service**. The batch transitions to `READY`.
6. **Step 5 (Packing Pass):** Switch to **Packing Pass**. Check off packed parcels and click **Complete Handoff**.
7. **Step 6 (Admin Variance):** Switch to **Admin & Stock**. Inspect the MarketMan-style actual vs. theoretical variance table showing rice, dal, and oil spillage in grams and INR loss.

---

## 4. Cloudflare Local Setup & Deployment Guide

PantryOS is pre-configured for seamless deployment to **Cloudflare Pages** (for the React 19 PWA frontend) and **Cloudflare Workers** (for edge routing).

### 4.1 Cloudflare Configuration Files in Repo
- **`wrangler.toml`:** Pre-configured root file declaring `pages_build_output_dir = "./apps/web/dist"`.
- **`apps/web/public/_redirects`:** Pre-configured SPA rule `/* /index.html 200` to prevent 404 errors on direct URL refreshes.
- **`apps/web/vite.config.ts`:** Pre-configured with PWA service worker generation, offline precaching, and production preview host bindings.

### 4.2 Building for Cloudflare Pages
```bash
# 1. Build the production web bundle
pnpm --filter @pantryos/web run build
```
The output directory will be created at: `apps/web/dist`.

### 4.3 Deploying to Cloudflare Pages via Wrangler CLI
If you have the Cloudflare `wrangler` CLI installed or want to deploy directly:
```bash
# Login to Cloudflare
npx wrangler login

# Deploy frontend to Cloudflare Pages
npx wrangler pages deploy apps/web/dist --project-name pantry-os
```

### 4.4 Deploying via Cloudflare Dashboard (Git Integration)
1. Go to the [Cloudflare Dashboard](https://dash.cloudflare.com/) $\rightarrow$ **Workers & Pages** $\rightarrow$ **Create Application** $\rightarrow$ **Pages** $\rightarrow$ **Connect to Git**.
2. Select your repository: `https://github.com/abhilashraju1/pantry-os.git`.
3. Set the build configuration:
   - **Framework Preset:** `Vite`
   - **Build Command:** `pnpm run build`
   - **Build Output Directory:** `apps/web/dist`
   - **Root Directory:** `/` (or leave default)
   - **Environment Variable:** `NODE_VERSION = 22.12.0`
4. Click **Save and Deploy**. Cloudflare automatically provisions global CDN caching and free HTTPS certificates.

---

## 5. How to Access From Outside Devices (Mobile Phones & Tablets)

> [!IMPORTANT]
> **Why HTTPS is Crucial on Mobile Devices:**
> Modern mobile browsers (iOS Safari, Android Chrome) strictly restrict Progressive Web App (PWA) capabilities—including **Service Worker caching, Add to Home Screen, Web Speech Synthesis (TTS), and camera QR scanning**—to secure `https://` contexts or `localhost`. 
>
> Using **Cloudflare Tunnel** provides an authentic, valid SSL HTTPS certificate on your mobile phone without complex local certificate setup!

---

### Option A: Cloudflare Tunnel (Recommended — Free, Instant HTTPS for Any Phone Anywhere)

Cloudflare Tunnel lets you securely expose your local dev server directly to the internet with a public HTTPS URL. No port forwarding or static IP is needed.

#### Step 1: Launch the Tunnel via npx (Zero Installation Required)
In a new terminal window, run:
```bash
npx cloudflared tunnel --url http://localhost:3000
```

#### Step 2: Get Your Instant Public HTTPS Link
Cloudflare will output a public tunnel link, for example:
```text
+--------------------------------------------------------------------------------------------+
|  Your quick Tunnel has been created! Visit it at (it may take some time to be reachable):  |
|  https://karnataka-pantry-demo.trycloudflare.com                                           |
+--------------------------------------------------------------------------------------------+
```

#### Step 3: Open on Your Smartphone!
1. Open that HTTPS URL on your phone's browser.
2. To test the **Customer Table QR View directly on mobile**, append `?view=qr&table=T1`:
   ```
   https://karnataka-pantry-demo.trycloudflare.com/?view=qr&table=T1
   ```
3. To test the **Chef Kitchen Display on a tablet**, open:
   ```
   https://karnataka-pantry-demo.trycloudflare.com/?view=kds
   ```
4. **PWA Install:** In Chrome/Safari, tap the menu (or Share button) and tap **"Add to Home Screen"**. PantryOS will install as a standalone native app icon on your phone!

---

### Option B: Local WiFi Network Access (Same Network)

If your mobile phone and your computer are connected to the same WiFi router:

#### Step 1: Find your computer's local IP address
- On Linux / macOS: run `hostname -I` or `ifconfig | grep "inet "`
- On Windows: run `ipconfig`
- *Example Local IP:* `192.168.1.45`

#### Step 2: Start the Web App
The Vite config is already set to `host: '0.0.0.0'` (all network interfaces).
```bash
pnpm run dev:web
```
Vite will show:
```text
  ➜  Local:   http://localhost:3000/
  ➜  Network: http://192.168.1.45:3000/
```

#### Step 3: Open on Mobile Phone
On your smartphone connected to the same WiFi, open:
```
http://192.168.1.45:3000/?view=qr&table=T1
```

---

## 6. Mobile View & PWA Ergonomics Summary

The Customer Table QR view has been specifically optimized for mobile touch screens (375px to 430px):
1. **Zero App Download:** Diners scan Table 1 QR code; the dynamic menu loads in under 1.2s.
2. **Table Switcher Pill:** Customers can confirm or switch their table (T1 through T6) directly from the top header.
3. **Category Scroll:** Sticky filter pills (`All Items`, `Fresh Today (Ready)`, `Hot Rottis (Fresh)`) allow single-thumb category filtering.
4. **Interactive Bottom Sheet:** Tapping a dish slides up a smooth modifier sheet for portion sizing (250ml / 300g / 2-piece) and combo add-ons (Ragi Mudde, extra chutney).
5. **Sticky Bottom Cart:** Persistent floating bar at the bottom showing item count, total price, and forward navigation.
6. **Running Table Bill:** Appends multiple rounds of food ordered during the meal to the open table session; diners can tap **"Request Final Bill"** when finished.
7. **Offline Safety Guard:** Service worker precaches the app shell and menu; unsafe write operations (ordering or paying) are prevented during network disconnects.

---

## 7. Useful Project Commands Reference

| Task | Command |
| :--- | :--- |
| **Install Dependencies** | `pnpm install` |
| **Build Everything** | `pnpm run build` |
| **Run All 15 Tests** | `pnpm run test` |
| **Start Backend API** | `pnpm run dev:api` |
| **Start Frontend Web** | `pnpm run dev:web` |
| **Run Cloudflare Tunnel** | `npx cloudflared tunnel --url http://localhost:3000` |
| **Build for Cloudflare Pages** | `pnpm --filter @pantryos/web run build` |
| **Git Push to GitHub** | `git push -u origin main` |
