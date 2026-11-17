# PANTRYOS — ONDC FOOD & BEVERAGES (RET11) FEASIBILITY & ADAPTER SPECIFICATION
**Version:** 1.0 | **Date:** 17 November 2026 | **Status:** Phase 0 Approved

---

## 1. Executive Summary & Reality Check
The Open Network for Digital Commerce (ONDC) is an open interoperable network protocol built upon the **Beckn Protocol** specifications. It is **not** an aggregator or a magic API bridge into proprietary food apps like Zomato or Swiggy. Rather, ONDC allows independent Buyer Apps (e.g., Paytm, Mystore, Magicpin, Pincode) to discover and order from independent Seller Apps.

For a standalone Karnataka vegetarian pantry:
* **Direct Network Participant Route:** Operating as a direct Seller Network Participant (SNP) requires setting up a certified Beckn gateway adapter, passing Pramaan compliance test suites, holding Ed25519 cryptographic signing keys, maintaining 99.9% network uptime, and signing formal network agreements.
* **Recommended Pragmatic Route:** Connect to the ONDC network via an existing accredited **Seller Enabler / SNP** (such as Mystore, GrowthNinjas, or eSamudaay) that exposes standard REST webhooks to the restaurant's POS.
* **PantryOS Architecture:** We build a normalized, protocol-compliant `OndcRet11Adapter` that handles Beckn v1.2.0 transaction states, catalog exports with F&B metadata, and order lifecycle webhooks.

---

## 2. ONDC RET11 Protocol Specifications

### 2.1 Domain & Context Parameters
```json
{
  "context": {
    "domain": "ONDC:RET11",
    "country": "IND",
    "city": "std:080",
    "action": "on_search",
    "core_version": "1.2.0",
    "bap_id": "buyer-app-network.ondc.org",
    "bap_uri": "https://buyer-app-network.ondc.org/protocol/v1",
    "bpp_id": "pantryos-seller.ondc.local",
    "bpp_uri": "https://api.pantryos.local/api/v1/integrations/ondc",
    "transaction_id": "txn_8c49e1e2-b816-43b9-a417-74070a75ad70",
    "message_id": "msg_06214152-45e3-4f11-9ec7-c0b38cbb0c50",
    "timestamp": "2026-11-17T14:15:00.000Z",
    "ttl": "PT30S"
  }
}
```

### 2.2 Core Transaction Flow State Machine
1. **Discovery (`search` $\rightarrow$ `on_search`):**
   - Buyer App broadcasts location coordinates (lat/long).
   - PantryOS responds with the menu catalog, store operating hours, F&B dietary flags (`veg: true`), item photos, portion prices, and estimated `prep_time` (e.g., `PT15M` for Akki Rotti, `PT5M` for pre-cooked Bisi Bele Bath).
2. **Item Selection (`select` $\rightarrow$ `on_select`):**
   - Buyer selects items, quantities, and portion variants.
   - PantryOS invokes the unified `AvailabilityService`. If available, quotes item prices, applicable GST (5%), and packaging charges.
3. **Fulfillment Initialization (`init` $\rightarrow$ `on_init`):**
   - Captures delivery address, customer phone, and calculates delivery fees via integrated logistics network.
4. **Order Confirmation (`confirm` $\rightarrow$ `on_confirm`):**
   - Finalizes order placement.
   - Generates internal PantryOS order (`channel: MOCK_ONDC`), atomically reserves portion yield, and fires kitchen/packing tasks.
5. **Fulfillment & Tracking (`status` $\rightarrow$ `on_status`):**
   - Emits real-time state updates: `Order-Accepted` $\rightarrow$ `In-Progress` $\rightarrow$ `Prepared` $\rightarrow$ `Ready-for-Pickup` $\rightarrow$ `Dispatched` $\rightarrow$ `Delivered`.

---

## 3. Cryptographic Verification & Security
All incoming ONDC requests must be verified against their HTTP `Authorization` header:
- Alg: `ed25519`
- Format: `Signature keyId="bap_id|key_id|ed25519",algorithm="ed25519",headers="(request-target) host date digest",signature="..."`
- Deduplication: Inbound `message_id` is cached in Redis with a 5-minute TTL to reject duplicate network transmissions.

---

## 4. Initial MVP Mock Simulator
Until the business owner establishes a commercial relationship with an ONDC Seller Partner, PantryOS includes an integrated **ONDC Sandbox Simulator** accessible at `/admin/integrations/ondc`:
- Generate simulated `search` pings.
- Emulate buyer cart creation and checkout.
- Inspect raw Beckn JSON request/response payloads.
- Test kitchen KDS and packing station reaction to incoming network orders.
