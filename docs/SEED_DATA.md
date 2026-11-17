# PANTRYOS — SEED DATA MASTER SPECIFICATION
**Version:** 1.0 | **Date:** 17 November 2026 | **Status:** Phase 0 Approved

> [!IMPORTANT]
> **DEMO / NOT OPERATOR APPROVED DISCLAIMER:**
> All ingredient quantities, costs, preparation durations, batch yields, food holding temperatures, shelf lives, and retail prices below are illustrative development fixtures designed to test data integrity and software functionality. They must be validated and signed off by a qualified chef, kitchen manager, and certified food safety operator before any commercial use.

---

## 1. Dish Specifications & Explicit BOM

### 1.1 Dish 1: Bassaru — ಬಸ್ಸಾರು
* **Policy:** `READY_BATCH` (Cooked in advance in bulk, held warm, portioned on demand)
* **Description:** Traditional Karnataka strained broth (saaru) made from boiled lentils and fresh leafy greens, tempered with mustard, cumin, and garlic, served alongside seasoned palya.
* **Batch Production Target:** Approx. 10 portions $\times$ 250 ml (Total Target Yield: 2,500 ml saaru + 750 g palya)
* **Selling Price (Illustrative):** ₹65.00 (`6500` paise)
* **Linked Sub-Recipe / Combo:** Ragi Mudde (Finger millet ball, optional addon ₹20.00)
* **Allergens:** Mustard (none of the major 8 allergens)
* **Equipment Needed:** 20L Stainless Steel Stockpot, Commercial Burner 1, Strainer

#### Bill of Materials (BOM) — 10 Portion Batch:
| Ingredient | Base Quantity | Base Unit | Unit Cost (Demo) | Ingredient Cost (Demo) |
| :--- | :--- | :--- | :--- | :--- |
| Toor Dal (ತೊಗರಿ ಬೇಳೆ) | 400 | g | ₹160.00 / kg | ₹64.00 |
| Leafy Greens / Dantu/Sabsige (ಸೊಪ್ಪು) | 500 | g | ₹40.00 / kg | ₹20.00 |
| Onion (ಈರುಳ್ಳಿ) | 200 | g | ₹35.00 / kg | ₹7.00 |
| Tomato (ಟೊಮೆಟೊ) | 250 | g | ₹30.00 / kg | ₹7.50 |
| Fresh Grated Coconut (ತೆಂಗಿನಕಾಯಿ ತುರಿ) | 100 | g | ₹120.00 / kg | ₹12.00 |
| Garlic (ಬೆಳ್ಳುಳ್ಳಿ) | 25 | g | ₹200.00 / kg | ₹5.00 |
| Green Chilli (ಹಸಿ ಮೆಣಸಿನಕಾಯಿ) | 25 | g | ₹80.00 / kg | ₹2.00 |
| Tamarind Paste (ಹುಣಸೆಹಣ್ಣು) | 30 | g | ₹150.00 / kg | ₹4.50 |
| Cumin Seeds (ಜೀರಿಗೆ) | 15 | g | ₹400.00 / kg | ₹6.00 |
| Mustard Seeds (ಸಾಸಿವೆ) | 10 | g | ₹120.00 / kg | ₹1.20 |
| Turmeric Powder (ಅರಿಶಿನ) | 5 | g | ₹250.00 / kg | ₹1.25 |
| Salt (ಉಪ್ಪು) | 30 | g | ₹20.00 / kg | ₹0.60 |
| Sunflower Oil (ಎಣ್ಣೆ) | 60 | ml | ₹130.00 / L | ₹7.80 |
| Water (ನೀರು) | 3,000 | ml | ₹0.00 | ₹0.00 |
| **Total Raw Ingredient Cost** | | | | **₹138.85** |
| **Packaging (per portion)** | 1 container + lid | unit | ₹4.00 / set | ₹40.00 (10 units) |
| **Total Batch Cost (10 portions)**| | | | **₹178.85** (~₹17.89 / portion) |

---

### 1.2 Dish 2: Bisi Bele Bath — ಬಿಸಿ ಬೇಳೆ ಬಾತ್
* **Policy:** `READY_BATCH` (Cooked in advance in a large heavy pot, held in thermal warmer)
* **Description:** Classic Mysore/Karnataka spicy rice-lentil dish cooked with vegetables, tamarind, and aromatic freshly ground spice mix, garnished with fried curry leaves.
* **Batch Production Target:** Approx. 10 portions $\times$ 300 g (Total Target Yield: 3,000 g / 3.0 kg)
* **Selling Price (Illustrative):** ₹90.00 (`9000` paise)
* **Allergens:** Mustard, Peanuts/Nuts (in garnish), Dairy (Ghee)
* **Equipment Needed:** 25L Heavy-Bottom Handi, Commercial Burner 2, Thermal Holding Pot

#### Bill of Materials (BOM) — 10 Portion Batch:
| Ingredient | Base Quantity | Base Unit | Unit Cost (Demo) | Ingredient Cost (Demo) |
| :--- | :--- | :--- | :--- | :--- |
| Sona Masoori Rice (ಅಕ್ಕಿ) | 650 | g | ₹60.00 / kg | ₹39.00 |
| Toor Dal (ತೊಗರಿ ಬೇಳೆ) | 350 | g | ₹160.00 / kg | ₹56.00 |
| Mixed Vegetables (Carrot, Beans, Potato) | 850 | g | ₹45.00 / kg | ₹38.25 |
| Onion (ಈರುಳ್ಳಿ) | 250 | g | ₹35.00 / kg | ₹8.75 |
| Tomato (ಟೊಮೆಟೊ) | 250 | g | ₹30.00 / kg | ₹7.50 |
| Tamarind Paste (ಹುಣಸೆಹಣ್ಣು) | 45 | g | ₹150.00 / kg | ₹6.75 |
| Bisi Bele Bath Spice Powder (ಮಸಾಲೆ ಪುಡಿ)| 90 | g | ₹300.00 / kg | ₹27.00 |
| Curry Leaves (ಕರಿಬೇವು) | 15 | g | ₹60.00 / kg | ₹0.90 |
| Mustard Seeds (ಸಾಸಿವೆ) | 10 | g | ₹120.00 / kg | ₹1.20 |
| Turmeric Powder (ಅರಿಶಿನ) | 5 | g | ₹250.00 / kg | ₹1.25 |
| Pure Ghee / Oil (ತುಪ್ಪ / ಎಣ್ಣೆ) | 90 | ml | ₹450.00 / L | ₹40.50 |
| Salt (ಉಪ್ಪು) | 40 | g | ₹20.00 / kg | ₹0.80 |
| Water (ನೀರು) | 3,200 | ml | ₹0.00 | ₹0.00 |
| **Total Raw Ingredient Cost** | | | | **₹227.90** |
| **Packaging (per portion)** | 1 bowl container + lid| unit | ₹5.00 / set | ₹50.00 (10 units) |
| **Total Batch Cost (10 portions)**| | | | **₹277.90** (~₹27.79 / portion) |

---

### 1.3 Dish 3: Akki Rotti — ಅಕ್ಕಿ ರೊಟ್ಟಿ
* **Policy:** `FRESH_ORDER` (Prepared immediately on customer order; exclusive tawa required)
* **Description:** Karnataka specialty flatbread crafted from seasoned rice flour, finely chopped onions, chillies, and cumin, hand-patted and roasted on a cast iron tawa until crisp-golden.
* **Serving Size:** 2 pieces per order (Approx. 120 g per piece, total 240 g per order)
* **Batch / Production Lot Target:** 10 customer orders (20 rottis)
* **Selling Price (Illustrative):** ₹80.00 (`8000` paise) per order of 2 pieces
* **Linked Sub-Recipe:** Coconut Chutney (50 ml cup included)
* **Allergens:** None (Naturally gluten-free)
* **Equipment Needed:** Cast Iron Tawa 1 (Exclusive Lock), Rolling Pin/Pasting Sheet, Burner 3

#### Bill of Materials (BOM) — 10 Orders (20 Rottis):
| Ingredient | Base Quantity | Base Unit | Unit Cost (Demo) | Ingredient Cost (Demo) |
| :--- | :--- | :--- | :--- | :--- |
| Rice Flour (ಅಕ್ಕಿ ಹಿಟ್ಟು) | 1,200 | g | ₹50.00 / kg | ₹60.00 |
| Finely Chopped Onion (ಈರುಳ್ಳಿ) | 300 | g | ₹35.00 / kg | ₹10.50 |
| Green Chilli (ಹಸಿ ಮೆಣಸಿನಕಾಯಿ) | 45 | g | ₹80.00 / kg | ₹3.60 |
| Fresh Coriander Leaves (ಕೊತ್ತಂಬರಿ ಸೊಪ್ಪು)| 70 | g | ₹70.00 / kg | ₹4.90 |
| Cumin Seeds (ಜೀರಿಗೆ) | 20 | g | ₹400.00 / kg | ₹8.00 |
| Salt (ಉಪ್ಪು) | 25 | g | ₹20.00 / kg | ₹0.50 |
| Sunflower Oil (ಎಣ್ಣೆ) | 150 | ml | ₹130.00 / L | ₹19.50 |
| Warm Water (ಬಿಸಿ ನೀರು) | 1,000 | ml | ₹0.00 | ₹0.00 |
| **Sub-Recipe: Coconut Chutney (10 x 50ml)** | Coconut, chilli, roasted gram | ₹35.00 batch | ₹35.00 |
| **Total Raw Ingredient Cost** | | | | **₹142.00** |
| **Packaging (per order)** | Foil pouch / clamshell box| unit | ₹3.50 / unit | ₹35.00 (10 units) |
| **Total Cost (10 orders)** | | | | **₹177.00** (~₹17.70 / order) |

---

## 2. Seeded Inventory Master (>20 Items)

1. `ING-001`: Sona Masoori Rice (ಅಕ್ಕಿ) - Grains - kg
2. `ING-002`: Toor Dal (ತೊಗರಿ ಬೇಳೆ) - Pulses - kg
3. `ING-003`: Rice Flour (ಅಕ್ಕಿ ಹಿಟ್ಟು) - Flour - kg
4. `ING-004`: Ragi Flour (ರಾಗಿ ಹಿಟ್ಟು) - Flour - kg
5. `ING-005`: Dantu / Sabsige Greens (ಸೊಪ್ಪು) - Vegetables - kg
6. `ING-006`: Onion (ಈರುಳ್ಳಿ) - Vegetables - kg
7. `ING-007`: Tomato (ಟೊಮೆಟೊ) - Vegetables - kg
8. `ING-008`: Carrot (ಕ್ಯಾರೆಟ್) - Vegetables - kg
9. `ING-009`: French Beans (ಹುರುಳಿಕಾಯಿ) - Vegetables - kg
10. `ING-010`: Potato (ಆಲೂಗಡ್ಡೆ) - Vegetables - kg
11. `ING-011`: Fresh Grated Coconut (ತೆಂಗಿನಕಾಯಿ ತುರಿ) - Perishables - kg
12. `ING-012`: Garlic (ಬೆಳ್ಳುಳ್ಳಿ) - Spices - kg
13. `ING-013`: Green Chilli (ಹಸಿ ಮೆಣಸಿನಕಾಯಿ) - Vegetables - kg
14. `ING-014`: Fresh Coriander Leaves (ಕೊತ್ತಂಬರಿ ಸೊಪ್ಪು) - Vegetables - kg
15. `ING-015`: Curry Leaves (ಕರಿಬೇವು) - Spices - kg
16. `ING-016`: Tamarind (ಹುಣಸೆಹಣ್ಣು) - Condiments - kg
17. `ING-017`: Cumin Seeds (ಜೀರಿಗೆ) - Spices - kg
18. `ING-018`: Mustard Seeds (ಸಾಸಿವೆ) - Spices - kg
19. `ING-019`: Turmeric Powder (ಅರಿಶಿನ) - Spices - kg
20. `ING-020`: Bisi Bele Bath Spice Powder (ಮಸಾಲೆ ಪುಡಿ) - Spices - kg
21. `ING-021`: Sunflower Cooking Oil (ಎಣ್ಣೆ) - Oils - L
22. `ING-022`: Pure Ghee (ತುಪ್ಪ) - Dairy/Oils - L
23. `ING-023`: Table Salt (ಉಪ್ಪು) - Seasoning - kg
24. `PKG-001`: 250ml Biodegradable Round Container + Lid - Packaging - pcs
25. `PKG-002`: 500ml Biodegradable Meal Box + Lid - Packaging - pcs
26. `PKG-003`: Foil-lined Hot Rotti Pouch - Packaging - pcs
27. `PKG-004`: Paper Delivery Carry Bag - Packaging - pcs

---

## 3. Seeded Organization, Branch, Equipment & Staff

* **Organization:** Mandya Traditional Pantries Private Limited (Brand: PantryOS)
* **Branch 1:** VV Puram Food Street Branch, Bangalore (`BLR-VVP-01`)
* **Tables:** 6 Tables (T1 through T6) with generated cryptographically random QR session tokens.
* **Stations:**
  - `STN-01`: Main Cooking Range (Stoves 1 & 2)
  - `STN-02`: Tawa Griddle Station (Tawa 1 & 2)
  - `STN-03`: Prep & Chopping Counter
  - `STN-04`: Packaging & Handoff Pass
* **Equipment (with exclusive lock capability):**
  - `EQ-01`: High-Flame Gas Burner 1 (Status: `AVAILABLE`)
  - `EQ-02`: High-Flame Gas Burner 2 (Status: `AVAILABLE`)
  - `EQ-03`: Cast Iron Akki Rotti Tawa 1 (Status: `AVAILABLE`)
  - `EQ-04`: Thermal Food Warmer Pot 1 (Status: `IN_USE` - Holding BBB)
* **Staff Users:**
  1. `admin@pantryos.local` — Suresh Kumar (Branch Manager)
  2. `chef@pantryos.local` — Manjunath Bhat (Head Chef)
  3. `cashier@pantryos.local` — Deepa Gowda (Cashier / Front Desk)
  4. `packer@pantryos.local` — Ramesh Nayak (Packer / Assistant)

---

## 4. Required Seed Scenarios (Verifiable via Automated Tests)
1. **Scenario A (Bassaru Ready Batch):** 1 ready batch cooked 45 mins ago, usable yield 2,500 ml (10 regular portions of 250ml), 2 portions reserved by pending order, 8 portions available.
2. **Scenario B (Bisi Bele Bath Partial Reservation):** 1 ready batch in Warmer Pot 1, actual yield 3,000 g (10 portions of 300g), 4 portions reserved across POS and Table QR, 6 portions remaining.
3. **Scenario C (Fresh Akki Rotti Order):** Customer order for 2 orders of Akki Rotti (4 pieces) placed via Table 3 QR; automatically queues on Tawa 1 with 12-minute cooking duration.
4. **Scenario D (Stove Lock Conflict Rejection):** Attempting to schedule another cooking task on Tawa 1 while Akki Rotti is active throws `STOVE_OCCUPIED_CONFLICT` error.
5. **Scenario E (Scheduled Takeaway Back-Scheduling):** Phone order placed at 12:00 for 13:30 pickup calculates start time at 13:08 considering prep, cooking, and 7-min packing buffer.
6. **Scenario F (Expired Batch Rejection):** An expired batch of cooked rice past 4-hour holding limit is automatically blocked from availability and cannot be allocated.
