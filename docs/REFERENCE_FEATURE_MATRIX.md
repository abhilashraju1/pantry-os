# PANTRYOS — REFERENCE FEATURE MATRIX
**Version:** 1.0 | **Date:** 17 November 2026 | **Status:** Phase 0 Approved

| Feature Domain | Benchmark Reference | Observed Capability | PantryOS Adaptation | Target Implementation Module | Priority |
| :--- | :--- | :--- | :--- | :--- | :--- |
| **Kitchen Display (KDS)** | Toast KDS | High-contrast dark mode, ticket urgency color transitions, audio alerts | Dedicated KDS tablet view, amber/red urgency cards, Web Audio cues | `apps/web/src/features/kds/ChefKDSView.tsx` | **P0** |
| **Kitchen Display (KDS)** | Toast KDS | All-Day Display item aggregation across tickets | Top summary ribbon showing total active portions needed across orders | `apps/web/src/features/kds/AllDaySummaryCard.tsx` | **P0** |
| **Kitchen Equipment** | Custom + Toast | Single exclusive stove assignment prevention | Transactional stove lock preventing concurrent overlapping assignments | `packages/business-rules/src/kitchen/stove-lock.ts` | **P0** |
| **Kitchen Guidance** | Petpooja KDS | Step-by-step recipe instructions on ticket tap | Bilingual Kannada/English recipe step cards with Web Speech TTS | `apps/web/src/features/kds/RecipeStepGuidance.tsx` | **P0** |
| **Cashier POS** | Petpooja POS | Rapid touch-grid order entry, hotkeys, bill splitting | Touch menu tiles, instant search, portion variant switcher, discount controls | `apps/web/src/features/pos/CashierPOSView.tsx` | **P0** |
| **Cash Reconciliation** | Petpooja POS | Cash session open/close, cash-in/out, expected vs counted variance | Cash Drawer Shift management with audit log | `packages/business-rules/src/payments/cash-session.ts` | **P0** |
| **Table QR Ordering** | Petpooja Scan-and-Order | Zero-install PWA, dynamic menu sync, out-of-stock toggle | Mobile PWA with server-validated opaque table token & live WebSocket updates | `apps/web/src/features/customer/TableQRView.tsx` | **P0** |
| **Table Sessions** | Petpooja QR | Multi-round ordering appending to same running bill | `table_sessions` state machine with cumulative items and bill request | `packages/database/src/schema/orders.ts` | **P0** |
| **Order Moderation** | Petpooja QR | Prank order protection with cashier review step | Staff validation queue on POS before firing customer orders | `apps/web/src/features/pos/OrderModerationQueue.tsx` | **P0** |
| **Recipe Costing** | MarketMan | BOM linking raw ingredients to unit purchase costs | Dynamic BOM calculations with theoretical vs actual yield variance | `packages/business-rules/src/recipes/cost-calculator.ts` | **P0** |
| **Sub-Recipes** | MarketMan | Nested preps (e.g. Broth, Chutney, Spice Mix) | Sub-recipe support with independent yields and stock tracking | `packages/database/src/schema/recipes.ts` | **P0** |
| **Inventory FEFO** | MarketMan | First-Expired-First-Out stock lot depletion | Stock lot assignment prioritizing nearest expiry date | `packages/business-rules/src/inventory/fefo-allocator.ts` | **P0** |
| **Inventory Variance** | MarketMan | Theoretical usage ($Sales \times BOM$) vs actual inventory counts | Daily/weekly inventory variance reconciliation report | `apps/web/src/features/reports/InventoryVarianceReport.tsx` | **P1** |
| **Touch Cart & UI** | Square for Restaurants | Bottom sheet customizer, sticky cart drawer, clear status pills | Tailwind 4 + Radix dialogs/sheets with Warm Pantry palette | `packages/ui/src/components/CartDrawer.tsx` | **P0** |
| **Multi-Branch Core** | Restroworks | Strict branch isolation and organization hierarchy | Multi-tenant schema with `organization_id` & `branch_id` foreign keys | `packages/database/src/schema/organizations.ts` | **P0** |
| **Open Commerce** | ONDC RET11 | Beckn protocol v1.2.0 F&B domain (search, select, init, confirm, status) | Normalized adapter interface with mock ONDC RET11 simulator | `packages/business-rules/src/integrations/ondc-ret11.ts` | **P1** |
| **Marketplace Mocks**| Zomato / Swiggy | Webhook order ingest, delivery partner status callbacks | Simulated external order ingest with webhook signature validation | `packages/business-rules/src/integrations/marketplace-mock.ts`| **P1** |
| **Mobile PWA Shell** | Modern PWA Standards | Service worker cache, install prompt, offline shell, write-blocking | `vite-plugin-pwa` with read-only offline guard and online sync | `apps/web/src/pwa/service-worker.ts` | **P0** |
