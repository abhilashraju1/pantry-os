# PANTRYOS — END-TO-END ACCEPTANCE & SCENARIO VERIFICATION
**Version:** 1.0 | **Date:** 18 November 2026 | **Status:** Verified

---

## 1. Primary Demonstration: Bisi Bele Bath Scheduled Pickup Flow

| Step | Action | Expected Behavior | Actual Automated Verification Result |
| :--- | :--- | :--- | :--- |
| **01** | Check Raw Inventory | Sona Masoori Rice (45kg), Toor Dal (22kg) have valid stock balances | **PASS** — Verified via `GET /api/v1/inventory/items`. |
| **02** | Recipe Approved | Bisi Bele Bath approved recipe specifies 650g rice, 350g dal, 850g veg per 3,000g batch | **PASS** — Verified via `store.dishes[1]`. |
| **03** | Batch Planned & Cooked | Batch #102 cooked on Gas Burner 2 | **PASS** — Batch record initialized in `READY` state. |
| **04** | Food Safety Signoff | Chef confirms core temp 79°C (≥ 60°C FSSAI rule) & actual usable yield 3,120g | **PASS** — Core temp check enforced; <60°C rejected. |
| **05** | Portions Derivation | Usable portions calculated: $\lfloor 3120 / 300 \rfloor = 10 \text{ portions}$ | **PASS** — `calculateMaxPortions(3120, 300)` returns 10. |
| **06** | Order Placement | Customer places order for 2 portions via POS | **PASS** — Portions atomically deducted from 6 remaining $\rightarrow$ 4 remaining. |
| **07** | Payment Collection | Order marked PAID via UPI QR | **PASS** — `POST /api/v1/payments` settles status to `PAID`. |
| **08** | Packing & Handoff | Packer marks checklist packed; customer handoff completed | **PASS** — Transitions to `PACKED` $\rightarrow$ `COMPLETED`. |

---

## 2. Additional Mandatory Acceptance Scenarios

### Scenario A: Exclusive Stove Lock Conflict
* **Test:** Attempting to assign a cooking task to `eq-burner-1` while an active task is running.
* **Result:** **PASS** — Returns HTTP 409 Conflict with error code `STOVE_OCCUPIED_CONFLICT`.

### Scenario B: Table QR Scan-and-Order Running Bill
* **Test:** Diner at Table 1 scans QR (`token_t1_98a7f`), submits items, and appends to open table session without downloading an app.
* **Result:** **PASS** — Session token validated; order placed under `QR_TABLE` channel.

### Scenario C: MarketMan Actual vs Theoretical Variance Reporting
* **Test:** Discrepancy between recipe theoretical usage and physical depletion calculated with cost impact in INR.
* **Result:** **PASS** — Sona Masoori Rice theoretical 1,950g vs actual 2,050g flags +100g spillage (+5.1%, ₹6.00 loss).

### Scenario D: High-Contrast Chef KDS & Audio Guidance
* **Test:** KDS dark mode renders with Top All-Day summary counts and Web Speech synthesis for Kannada and English.
* **Result:** **PASS** — Component renders with SpeechSynthesisUtterance toggle.
