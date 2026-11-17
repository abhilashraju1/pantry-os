# PANTRYOS — REFERENCE BENCHMARK ANALYSIS & INSPIRATION
**Document Version:** 1.0 | **Date:** 17 November 2026 | **Status:** Phase 0 Approved

---

## 1. Executive Summary & Methodology
In accordance with Section 5 of the PantryOS Master Development Prompt and PRD Section 07/11, this document provides an honest, empirical analysis of six premier industry benchmarks in restaurant POS, kitchen display systems (KDS), inventory recipe costing, customer QR self-ordering, and open commerce protocols. 

**Legal & Copyright Boundary:** We study *operational patterns, user interaction flows, and architectural mechanisms*. No proprietary source code, protected graphic assets, trademarks, or screen designs are copied. All UI elements, styling, and code in PantryOS are original implementations built with our Warm Pantry design system.

---

## 2. Benchmark Source Analysis

### 2.1 Toast Kitchen Display System (Toast KDS)
* **Official URLs:**  
  - [Toast KDS Hardware & System Overview](https://pos.toasttab.com/hardware/kitchen-display-system)  
  - [Toast Platform Guide: KDS Overview](https://doc.toasttab.com/doc/platformguide/platformKDSOverview.html)
* **Observed UI & Operational Workflows:**
  - **High-Contrast Dark Mode:** Designed for greasy, steamy kitchen environments with wide viewing angles; reduces eye strain under fluorescent lights.
  - **Color-Coded Ticket Urgency:** Tickets start neutral (green/charcoal), transition to warning amber at 70% elapsed prep time, and flash/highlight bright red when overdue.
  - **All-Day Display Mode (Item Aggregation):** Crucial for fast-casual and batch production. Instead of counting individual tickets, line cooks see consolidated item sums across all open tickets (e.g., "18 Akki Rotti", "6 Bassaru Meals").
  - **Station Routing & Course Firing:** Allows routing hot dishes to the stove station, cold items to packing, and holding courses until triggered by the expediter.
  - **Item-Level Bumping & Ticket Recall:** Cooks can tap off individual items as prepared and recall accidentally completed tickets within a configurable buffer.
* **PantryOS Adaptation:**
  - Dedicated high-contrast Chef KDS view (`apps/web/src/features/kds/ChefKDSView.tsx`).
  - Active stove assignment with prominent countdown timers.
  - Consolidated All-Day Item Summary card at the top of the KDS.
  - Audio and visual alerts on timer expiration.

---

### 2.2 Petpooja POS, QR Ordering & KDS
* **Official URLs:**  
  - [Petpooja POS System](https://www.petpooja.com/poss)  
  - [Petpooja Scan & Order (QR Dining)](https://www.petpooja.com/poss/scan-and-order)  
  - [Petpooja Kitchen Display System](https://www.petpooja.com/poss/kitchen-display-system)
* **Observed UI & Operational Workflows:**
  - **Indian Quick-Service Billing & KOT:** Rapid touch-grid order punching with hotkeys for frequent items, instant print of kitchen order tickets (KOT), and split payments.
  - **Table QR Scan-and-Order:** Zero-app-install web app launched from a table QR code. Dynamic real-time sync with POS stock. If an item is toggled out-of-stock on the POS, it immediately disappears/greys out on the diner's mobile view.
  - **Multi-Round Running Table Bills:** Subsequent scans at Table 4 append items to the open table session rather than creating separate disconnected tickets.
  - **Order Moderation / Staff Validation:** Prevents prank orders; submitted QR orders enter a quick validation queue on the cashier POS before KOT firing.
  - **Cash Shift Reconciliation:** Strict opening cash balance, cash-in/cash-out logging, and end-of-shift cash drawer variance reconciliation.
* **PantryOS Adaptation:**
  - Cashier POS touch tile interface with fast search and category filter (`/pos`).
  - Customer PWA table session with server-validated opaque tokens (`/t/:tableToken`).
  - Running table bill ledger allowing multi-round ordering.
  - Shift management module with expected vs counted cash audit (`/pos/shift`).

---

### 2.3 MarketMan (Recipe Costing & Inventory Intelligence)
* **Official URLs:**  
  - [MarketMan Recipe Costing Software](https://www.marketman.com/platform/recipe-costing-software)  
  - [MarketMan Restaurant Inventory Management](https://www.marketman.com/platform/restaurant-inventory-management-software)
* **Observed UI & Operational Workflows:**
  - **Dynamic Bill of Materials (BOM):** Recipes link directly to purchase ingredients. When vendor purchase prices change, recipe and sub-recipe theoretical costs recalculate automatically.
  - **Sub-Recipes & Intermediate Preps:** Nested recipe structures (e.g., spice mix -> broth -> finished meal) that account for cooking yield loss and scrap.
  - **Theoretical vs. Actual Variance Analysis:** Calculates discrepancies between theoretical ingredient usage ($Sales \times Recipe\_BOM$) and actual physical inventory depletion ($Opening + Purchases - Closing$). Flags kitchen waste, over-portioning, and spillage.
  - **FEFO Lot Tracking:** First-Expired-First-Out ingredient allocation to minimize spoilage of perishables like fresh coriander, greens, and grated coconut.
* **PantryOS Adaptation:**
  - `packages/database/src/schema/recipes.ts` and `inventory.ts` with explicit BOM, sub-recipes, and unit conversion matrices (e.g. kg to g, liter to ml).
  - Real batch actual usable yield tracking vs theoretical yield.
  - Batch wastage reason codes (burnt, dropped, expired, quality reject).
  - Variance reporting module in manager dashboard (`/reports/inventory-variance`).

---

### 2.4 Square for Restaurants
* **Official URLs:**  
  - [Square for Restaurants POS](https://squareup.com/us/en/point-of-sale/restaurants)
* **Observed UI & Operational Workflows:**
  - **Ergonomic Category Tiles & Custom Modifiers:** Large touch targets, customizable item grid colors, clean nested modifier sheets (e.g. Size: Small / Regular, Add-on: Ragi Mudde).
  - **Omnichannel Cart Hierarchy:** Seamlessly switches between dine-in, takeaway, and scheduled pickup in a single unified cart drawer.
  - **Immediate Visual Status:** Orders clearly display fulfillment states (Draft, Placed, Preparing, Ready, Delivered) with accessible status pills.
* **PantryOS Adaptation:**
  - Responsive drawer/sheet cart on mobile and split-pane layout on desktop/tablet.
  - Clean portion selector (250ml / 300g / 2-piece) with real-time price updates.
  - Semantic status badges across all order lists.

---

### 2.5 Restroworks (Formerly Posist)
* **Official URLs:**  
  - [Restroworks Unified Restaurant Platform](https://www.restroworks.com/)
* **Observed UI & Operational Workflows:**
  - **Multi-Outlet Modular Monolith Architecture:** Multi-tenant/branch data partitioning with strict organization and branch scoping on every query.
  - **Centralized Master Catalog with Local Overrides:** Branch-level pricing, availability toggling, and equipment configuration while preserving global recipe formulas.
  - **Role-Based Granular Permissions (RBAC):** Strict boundaries separating cashier, chef, packer, inventory clerk, and manager views.
* **PantryOS Adaptation:**
  - Organization and branch foreign keys enforced on all domain tables.
  - Multi-role RBAC server-enforced in Fastify hooks.
  - Audit logging for privileged overrides and discounts.

---

### 2.6 ONDC (Open Network for Digital Commerce) Food & Beverages (RET11)
* **Official URLs & Technical Guides:**  
  - [ONDC Food & Beverages Domain](https://www.ondc.org/pages/food-and-beverages.html)  
  - [ONDC Developer Guide & Workbench](https://workbench.ondc.tech/developer-guide)  
  - [ONDC Official Developer Documentation](https://github.com/ONDC-Official/developer-docs)
* **Observed Protocol & Data Requirements:**
  - **Domain Code:** `ONDC:RET11` explicitly set in the Beckn API context.
  - **Decentralized Beckn Protocol v1.2.0 / v1.2.5:** Asynchronous action/on_action request pairs: `search`/`on_search`, `select`/`on_select`, `init`/`on_init`, `confirm`/`on_confirm`, `status`/`on_status`, `track`/`on_track`, `cancel`/`on_cancel`.
  - **F&B Catalog Attributes:** Nested customizations via parent-child item groups; mandatory dietary flags (`veg` / `non-veg`); explicit preparation lead time (`prep_time`) for hyperlocal delivery logistics.
  - **Security & Network Compliance:** Ed25519 cryptographic request signing (Authorization header with `Signature keyId="..."`), timestamp TTL validation, and deduplication of transaction IDs.
  - **Strategic Reality for Small Pantries:** Small standalone food pantries do not directly become an ONDC Gateway or BAP (Buyer App). The compliant, cost-effective route is connecting as an Inventory Seller Node via an approved ONDC Seller Network Participant (SNP).
* **PantryOS Adaptation:**
  - Normalized adapter interface (`packages/business-rules/src/integrations/types.ts`).
  - Realistic mock ONDC RET11 adapter handling webhook verification, simulated catalog responses, and order confirmation.
  - Strict isolation: mock external orders are clearly tagged and never confuse real cashier/kitchen operations.

---

## 3. Summary of Core Design Directives
From these six benchmarks, PantryOS derives its four architectural pillars:
1. **One Source of Truth for Portions:** We don't guess plate counts from raw stock; portions are derived from *actual cooked batch yield* (inspired by MarketMan + Petpooja).
2. **Kitchen Safety & Exclusive Equipment:** Timers don't auto-certify safety, and stoves cannot have overlapping active tasks (inspired by Toast KDS with food safety guardrails).
3. **Frictionless Mobile-First PWA:** Zero-install table QR ordering with running bill sessions and staff validation (inspired by Petpooja & Square).
4. **Partner-Ready Normalized Integrations:** Standardized order contracts ready for ONDC RET11, Swiggy, and Zomato through robust mock adapters.
