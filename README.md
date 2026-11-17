# PantryOS (ಪ್ಯಾಂಟ್ರಿ ಓಎಸ್)
> **Smart Karnataka Vegetarian Pantry, Kitchen, POS & Commerce Platform**  
> GitHub Repository: [https://github.com/abhilashraju1/pantry-os.git](https://github.com/abhilashraju1/pantry-os.git)

---

## Overview
PantryOS is an operations platform and Progressive Web App (PWA) built specifically for a Karnataka vegetarian food pantry with a shared kitchen. 

Unlike generic restaurant POS software that merely tallies sales, PantryOS connects:
1. **Raw Ingredient Stock & FEFO Expiry** (20+ local items, pulses, flours, spices).
2. **Dynamic Bill of Materials (BOM)** with sub-recipes (Ragi Mudde, Coconut Chutney).
3. **Batch Production & Usable Yield Tracking** (deriving customer portion availability from real cooked kg/ml yield, not plate approximations).
4. **Shared Kitchen Equipment Control** with exclusive stove/tawa locks preventing concurrent scheduling conflicts.
5. **Chef-Guided Cooking Timers & Web Speech TTS** in Kannada (ಕನ್ನಡ) and English.
6. **Omnichannel Order State Machine** covering Walk-In Counter POS, Table QR Scan-and-Order, Phone Scheduled Pickups, and Mock ONDC RET11 & Delivery Aggregator adapters.
7. **Strict Separation of Payment from Fulfillment** supporting dine-in pay-after-meal, phone pay-at-pickup, and verified UPI/Cashier reconciliation.

---

## Visual Identity: Warm Pantry
- **Background Cream:** `#FAF8F3`
- **Forest Green (Primary):** `#234B3A`
- **Amber / Mustard (Accent):** `#D79B52`
- **Dark Slate (Text):** `#2A2E2B`
- **Neutral Card Border:** `#E9E6DD`
- **Bilingual Typography:** Inter (English) + Noto Sans Kannada (ಕನ್ನಡ)

---

## Seed Menu Dishes
1. **Bassaru (ಬಸ್ಸಾರು):** `READY_BATCH` - Toor dal & greens broth with seasoned palya, linked Ragi Mudde sub-recipe combo.
2. **Bisi Bele Bath (ಬಿಸಿ ಬೇಳೆ ಬಾತ್):** `READY_BATCH` - Classic Mysore rice-lentil-vegetable pot dish with pure ghee & spice garnish.
3. **Akki Rotti (ಅಕ್ಕಿ ರೊಟ್ಟಿ):** `FRESH_ORDER` - Rice flour flatbread roasted crisp on exclusive cast iron tawa, served with fresh coconut chutney.

---

## Monorepo Architecture
- `apps/web`: React 19 + Vite PWA (Admin, POS, Chef KDS, Customer QR)
- `apps/api`: Fastify 5 REST & WebSocket API
- `packages/contracts`: Zod schemas & shared DTOs
- `packages/business-rules`: Decimal-safe domain logic, state machines, and calculators
- `packages/database`: Drizzle ORM schema, migrations, and PGlite / Postgres adapters
- `packages/ui`: Accessible Tailwind & Radix UI design components
- `packages/i18n`: Kannada and English localization dictionaries
- `services/worker`: BullMQ background jobs for timers and notifications

---

## Documentation Index
- [Reference Benchmark Analysis](file:///home/5296658037_0/.gemini/antigravity/scratch/pantry-os/docs/REFERENCE_ANALYSIS.md)
- [Reference Feature Matrix](file:///home/5296658037_0/.gemini/antigravity/scratch/pantry-os/docs/REFERENCE_FEATURE_MATRIX.md)
- [System Architecture](file:///home/5296658037_0/.gemini/antigravity/scratch/pantry-os/docs/ARCHITECTURE.md)
- [Database Schema Specification](file:///home/5296658037_0/.gemini/antigravity/scratch/pantry-os/docs/DATABASE_SCHEMA.md)
- [Seed Data Master Specification](file:///home/5296658037_0/.gemini/antigravity/scratch/pantry-os/docs/SEED_DATA.md)
- [Architecture Decisions (ADRs)](file:///home/5296658037_0/.gemini/antigravity/scratch/pantry-os/docs/DECISIONS.md)
- [ONDC RET11 Feasibility Specification](file:///home/5296658037_0/.gemini/antigravity/scratch/pantry-os/docs/ONDC_FEASIBILITY.md)
