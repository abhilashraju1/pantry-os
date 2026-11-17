# PANTRYOS — BATCH PRODUCTION & PORTION ENGINE SPECIFICATION
**Version:** 1.0 | **Date:** 17 November 2026 | **Status:** Phase 0 Approved

---

## 1. The Core PantryOS Batch Philosophy
Traditional restaurant POS systems operate on abstract "stock counts" where 50 portions are arbitrarily entered into a menu item. If a cook spills a pot, boils off too much liquid, or portions inconsistently, the inventory and POS rapidly diverge.

In PantryOS:
$$\text{Available Portions} = \left\lfloor \frac{\text{Actual Usable Cooked Yield}}{\text{Per-Portion Unit Weight or Volume}} \right\rfloor - \text{Active Reservations}$$

No order can promise food that does not physically exist or have dedicated kitchen cooking capacity.

---

## 2. Batch Lifecycle & States

```
[PLANNED]
   ↓ (Chef plans batch for morning service)
[INGREDIENTS_RESERVED]
   ↓ (System locks required Toor Dal, Rice, Veggies via FEFO)
[PREPARING]
   ↓ (Prep table chopping, spice roasting)
[COOKING]
   ↓ (Exclusive Burner Lock acquired, server countdown timer runs)
[QUALITY_CHECK]
   ↓ (Chef performs FSSAI temperature check and records ACTUAL USABLE YIELD)
[READY / HOLDING]
   ↓ (Portions become available for POS & Table QR ordering)
[EXHAUSTED / EXPIRED]
   ↓ (Portions reach 0 or 4-hour warm holding limit expires)
[TERMINAL ARCHIVED]
```

---

## 3. Worked Production Example: Bisi Bele Bath
1. **Planned Batch:** Target 3,000 g cooked yield (approx. 10 portions of 300 g).
2. **Ingredient Allocation:**
   - Sona Masoori Rice: 650 g
   - Toor Dal: 350 g
   - Mixed Vegetables: 850 g
   - Spices, Tamarind & Oil: 540 g
   - Water: 3,200 ml
3. **Cooking & Evaporation:**
   - Cooked on Burner 2 for 42 minutes.
   - Water absorption and steam evaporation measured.
4. **Actual Weigh-In at Quality Check:**
   - Usable cooked yield recorded: **3,120 g** (Exceeded expectation by 120 g).
   - Food Safety Check: Core temperature verified at 78°C (Pass).
   - Usable Portions calculated: $\lfloor 3120 / 300 \rfloor = 10 \text{ portions}$ with 120 g margin.
5. **Atomic Reservation:**
   - Order #1001 reserves 3 portions (900 g).
   - Remaining unreserved weight: 2,220 g (7 portions).
   - If Order #1002 attempts to reserve 8 portions, the system atomically rejects with: `INSUFFICIENT_BATCH_PORTIONS (Requested 8, Available 7)`.
