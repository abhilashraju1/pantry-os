# PANTRYOS — ARCHITECTURE DECISION RECORDS (ADR)
**Version:** 1.0 | **Date:** 17 November 2026 | **Status:** Phase 0 Approved

---

## ADR-001: Modular Monolith vs. Microservices
* **Status:** Accepted
* **Context:** The system serves a single-branch vegetarian food pantry with shared kitchen equipment and real-time inventory synchronization.
* **Decision:** Build a modular monolith in TypeScript using `pnpm` workspaces (`apps/web`, `apps/api`, `packages/*`).
* **Consequences:** 
  - Zero network overhead between inventory, recipes, and ordering.
  - Strict database-level ACID transactions for atomic reservations.
  - Significantly lower operational complexity (single deployment unit).

---

## ADR-002: Dual Database Adapter (PGlite for Dev/Test, Standard Postgres for Prod)
* **Status:** Accepted
* **Context:** The development and CI sandbox environments may not have Docker daemons or system-level `psql` running.
* **Decision:** Use Drizzle ORM configured with an abstraction that supports `@electric-sql/pglite` (real in-memory/embedded WebAssembly PostgreSQL) in local dev and testing, while seamlessly connecting to standard PostgreSQL via `pg` / `postgres-js` in production or Docker Compose.
* **Consequences:**
  - 100% Postgres-compatible SQL syntax, foreign keys, transactions, and JSONB queries run without external dependencies.
  - Fast, isolated test executions in Vitest.
  - Production code remains completely identical.

---

## ADR-003: Progressive Web App (PWA) vs. Native Mobile Apps
* **Status:** Accepted
* **Context:** Staff operate across desktop (cashier), Android tablets (kitchen), and consumer mobile phones (QR dining and manager monitoring).
* **Decision:** Implement a responsive, installable Progressive Web App with `vite-plugin-pwa`, responsive viewport layouts, and touch-optimized controls. Native iOS/Android apps are explicitly deferred to post-v1.
* **Consequences:**
  - Zero friction for dining customers (scan table QR and immediately order without app store downloads).
  - Cross-platform updates instantly pushed to all kitchen and cashier screens.
  - Hardware printing handled via clean browser print stylesheets first, with bridge adapter hooks for ESC/POS thermal printers.

---

## ADR-004: Decimal-Safe Financial and Metric Representation
* **Status:** Accepted
* **Context:** JavaScript IEEE 754 floating-point numbers cause catastrophic rounding errors in inventory deductions ($0.1 + 0.2 \neq 0.3$) and currency sums.
* **Decision:**
  - All currency is stored as integer paise (1 INR = 100 paise).
  - All inventory weights and volumes are recorded in canonical base units: grams (`g`) and milliliters (`ml`), calculated with integer or exact decimal arithmetic.
* **Consequences:** Eliminates rounding loss and ledger drift.

---

## ADR-005: Separation of Fulfillment State from Payment State
* **Status:** Accepted
* **Context:** Table diners pay after eating; phone takeaway customers pay at counter pickup; walk-ins pay immediately; online orders may be prepaid.
* **Decision:** `orders.status` (Fulfillment state machine) is strictly distinct from `payments.status` (Payment state machine).
* **Consequences:**
  - Kitchen starts cooking when order is `ACCEPTED` even if `payment_status` is `UNPAID` (for dine-in / trusted phone orders).
  - Handover and session close enforce payment settlement rules per channel policy.

---

## ADR-006: Exclusive Kitchen Equipment Locking
* **Status:** Accepted
* **Context:** A single kitchen has limited stoves and tawas. Two chefs or tasks cannot occupy the same gas burner simultaneously.
* **Decision:** Introduce `cooking_tasks` with database-enforced exclusion constraints or transactional lock checks (`WHERE equipment_id = :id AND status = 'IN_PROGRESS'`).
* **Consequences:** Prevents scheduling collisions; accurately back-schedules pickup orders based on real station availability.

---

## ADR-007: Open Operator Decisions & Legal Approvals Required
* **Status:** Documented for Operator Review
* **The following items are designated as operator-configurable parameters, not hardcoded guesses:**
  1. *FSSAI Food Safety Holding Rules:* Max holding temperature and duration (demo default: 4 hours at >60°C).
  2. *GST & Municipal Tax Rates:* Configurable via `branches.tax_rate_percent` (demo default: 5% GST for food service without ITC).
  3. *Payment Gateway Onboarding:* Razorpay / PineLabs / PhonePe merchant credentials must be provided by the pantry owner; mock simulator used in development.
  4. *ONDC Seller Network Participant (SNP):* Commercial onboarding through an accredited SNP (e.g., Mystore, GrowthNinjas, or magicpin) is required for real network traffic.
