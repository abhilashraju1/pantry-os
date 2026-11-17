# PANTRYOS — API CONTRACTS & WEBSOCKET SPECIFICATION
**Version:** 1.0 | **Date:** 17 November 2026 | **Status:** Phase 0 Approved

---

## 1. Global API Standards
* **Base URL:** `/api/v1`
* **Transport:** HTTPS (TLS 1.3) + Authenticated WebSockets (`wss://.../api/v1/ws`)
* **Headers:**
  - `Content-Type: application/json`
  - `X-Branch-ID: <uuid>` (Mandatory branch context)
  - `Idempotency-Key: <uuid>` (Required on all financial & reservation mutations)
* **Standard Response Envelope:**
  ```json
  {
    "success": true,
    "data": {},
    "meta": { "timestamp": "2026-11-17T14:30:00.000Z", "version": "1.0.0" }
  }
  ```
* **Standard Error Envelope:**
  ```json
  {
    "success": false,
    "error": {
      "code": "STOVE_OCCUPIED_CONFLICT",
      "message": "Gas Burner 1 is currently locked by Batch #104 until 14:45",
      "details": { "equipmentId": "eq_01", "lockedUntil": "2026-11-17T14:45:00.000Z" }
    }
  }
  ```

---

## 2. Core REST Endpoints

### 2.1 Authentication & Sessions
- `POST /api/v1/auth/login`: Email + password authentication; sets HTTP-only secure cookie `pantry_session`.
- `POST /api/v1/auth/logout`: Invalidates session token in Redis & DB.
- `GET /api/v1/auth/me`: Returns current user profile, roles, and branch assignments.
- `POST /api/v1/auth/table-session`: Validates opaque table QR token and returns active session JWT.

### 2.2 Inventory & Procurement
- `GET /api/v1/inventory/items`: List all ingredients, categories, and stock balances with reorder warnings.
- `POST /api/v1/inventory/receipts`: Record inbound goods receipt against a PO; creates `stock_lots`.
- `POST /api/v1/inventory/wastage`: Record reason-coded spoilage or loss with supervisor signoff.
- `GET /api/v1/inventory/variance`: MarketMan-style actual vs theoretical ingredient consumption report.

### 2.3 Recipes, BOM & Menu
- `GET /api/v1/recipes`: List recipes with active version BOM and sub-recipe references.
- `POST /api/v1/recipes/:id/versions`: Create new recipe draft version.
- `POST /api/v1/recipes/:id/versions/:vId/approve`: Chef/Manager signoff making recipe version active.
- `GET /api/v1/menu`: Public/customer menu with real-time portion availability and variants.

### 2.4 Batch Production & Equipment
- `POST /api/v1/batches/plan`: Create planned batch; validates ingredient stock availability.
- `POST /api/v1/batches/:id/reserve-ingredients`: Atomically reserve FEFO ingredient lots.
- `POST /api/v1/batches/:id/start-cooking`: Acquire exclusive stove lock and fire BullMQ timer.
- `POST /api/v1/batches/:id/steps/:stepId/acknowledge`: Chef step completion and voice cue.
- `POST /api/v1/batches/:id/complete`: Record actual usable yield (grams/ml) and food safety quality check.
- `GET /api/v1/equipment/status`: Real-time status of all burners, tawas, and stations.

### 2.5 Omnichannel Orders & Availability
- `GET /api/v1/availability/check`: Unified omnichannel check returning `availableNow`, `maxPortions`, and `estimatedReadyAt`.
- `POST /api/v1/orders`: Create new order (POS, QR, Phone, Mock ONDC). Validates idempotency key.
- `POST /api/v1/orders/:id/accept`: Staff order acceptance; commits portion reservations.
- `POST /api/v1/orders/:id/packing-done`: Marks packing checklist complete.
- `POST /api/v1/orders/:id/handoff`: Confirms customer pickup or waiter table delivery.

### 2.6 Payments & Cash Shifts
- `POST /api/v1/payments/create-intent`: Generates UPI dynamic QR or card intent.
- `POST /api/v1/payments/verify-cash`: Cashier confirms cash receipt at counter.
- `POST /api/v1/payments/webhook/:provider`: Secure webhook ingest for online gateway / UPI confirmation.
- `POST /api/v1/shifts/open`: Open cash drawer shift with opening float.
- `POST /api/v1/shifts/close`: Close shift with counted cash and variance audit.

---

## 3. Real-Time WebSocket Protocol
* **Endpoint:** `/api/v1/ws?branchId=<uuid>`
* **Handshake Authentication:** Authenticated cookie or Bearer token header.
* **Inbound Client Actions:**
  - `SUBSCRIBE_STATION`: Filter events to a specific station (e.g. `STOVE_STATION` for Chef KDS).
  - `PING`: Keep-alive packet (client sends every 25s).
* **Outbound Server Events:**
  - `ORDER_CREATED`: Inbound order requiring cashier moderation or kitchen prep.
  - `ORDER_STATUS_CHANGED`: Status update for customer tracking screen and POS.
  - `KITCHEN_TIMER_TICK`: Authoritative countdown synchronization.
  - `EQUIPMENT_LOCKED` / `EQUIPMENT_RELEASED`: Real-time burner status broadcast.
  - `ITEM_OUT_OF_STOCK`: Instant push when batch yield is exhausted.
