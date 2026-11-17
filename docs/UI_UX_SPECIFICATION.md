# PANTRYOS — UI/UX & MOBILE VIEW PWA SPECIFICATION
**Version:** 1.0 | **Date:** 17 November 2026 | **Status:** Phase 0 Approved

---

## 1. Visual Design Foundation (Warm Pantry)
The PantryOS design identity draws inspiration from traditional Karnataka kitchen warmth (brass cookware, wood, clay pots, fresh green leaves) combined with crisp, modern Scandinavian ergonomics.

### Color Tokens
* **Background Canvas:** `#FAF8F3` (Warm eggshell/cream — reduces glare on handheld screens)
* **Surface Neutral:** `#FFFFFF` (Pure white card containers)
* **Neutral Border:** `#E9E6DD` (Subtle boundary lines)
* **Primary Brand:** `#234B3A` (Deep Karnataka Forest Green — trustworthy, vegetarian identity)
* **Primary Foreground:** `#FFFFFF`
* **Accent / Action:** `#D79B52` (Warm Sandalwood / Mysore Amber — calls to action, highlights, active timers)
* **Text Primary:** `#2A2E2B` (Charcoal Slate — high contrast reading without harsh pure black)
* **Text Muted:** `#6B726B` (Accessible secondary text)
* **Urgency Alert:** `#C0392B` (Chilli Red — overdue timers, out of stock, errors)
* **Warning / Prep:** `#D97706` (Turmeric Amber — expiring lots, preparing tasks)
* **Success / Ready:** `#1B6E44` (Fresh Curry Leaf Green — food safety approved, paid, packed)

### Typography
* **Latin / Numerical Text:** `Inter`, system-ui, sans-serif
* **Kannada Script:** `Noto Sans Kannada`, `Kannada Sangam MN`, sans-serif
* **Monospace / Counters:** `JetBrains Mono`, `ui-monospace` (for receipt totals, order numbers, step countdown timers)

---

## 2. Progressive Web App (PWA) & Mobile View Architecture

### 2.1 PWA Configuration & Manifest
* **Name:** `PantryOS — Smart Food Pantry & Kitchen`
* **Short Name:** `PantryOS`
* **Display Mode:** `standalone` (Full-screen native app appearance with removed browser chrome)
* **Theme Color:** `#234B3A`
* **Background Color:** `#FAF8F3`
* **Orientation:** Responsive.
  - Cashier: Desktop / Horizontal Tablet (Landscape)
  - Chef KDS: Tablet Landscape or Wall-Mounted Smart Display
  - Customer & Waiter QR: Mobile Portrait (360px – 430px viewport width)
* **Offline Strategy:**
  - Service worker caches static application assets (JS, CSS, fonts, SVG icons, dish placeholders).
  - Cache-first strategy for static reference data (units, dish photos, language strings).
  - **Write-Blocking Guard:** Unsafe financial transactions, stock mutations, or order placements are blocked when offline. The UI displays an amber `OFFLINE_MODE` pill and queues read-only views with a clear banner.

### 2.2 Customer Mobile View (Table QR & Takeaway)
* **Viewport Target:** 375px $\times$ 667px (iPhone SE) up to 430px $\times$ 932px (Pro Max / modern Androids).
* **Zero App Download:** Scans table QR (`https://pantryos.local/t/tbl_01_a9f8...`) and loads directly in mobile browser in <1.2s.
* **Top App Bar:**
  - Pantry brand logo + Branch name (`VV Puram Branch`).
  - Active Table Badge (`Table 4`) with session indicator.
  - Language toggle pill: `English` | `ಕನ್ನಡ`.
* **Category Tabs (Sticky Horizontal Pill Scroll):**
  - All (ಎಲ್ಲವೂ) | Ready Today (ಇಂದಿನ ವಿಶೇಷ) | Fresh Rottis (ಬಿಸಿ ರೊಟ್ಟಿಗಳು) | Combos & Sweets
* **Dish Card Layout (Photo-Forward, Touch-Optimized):**
  - Aspect ratio 4:3 high-res WebP image with rounded-xl corners.
  - Green Veg dot icon + Kannada name prominent (`ಬಿಸಿ ಬೇಳೆ ಬಾತ್`) + English name (`Bisi Bele Bath`).
  - Portion size selector (e.g., `250 ml` vs `500 ml`).
  - Dynamic stock indicator:
    - *Available (ಹಸಿರು):* Shows price ₹90.00 and large `+ Add` button (min 48px tap target).
    - *Low Stock (ಕಿತ್ತಳೆ):* "Only 4 portions left".
    - *Sold Out (ಬೂದು):* Greys out with disabled button "Sold Out / ಮುಗಿದಿದೆ".
* **Interactive Bottom Sheet (Modifiers & Add-ons):**
  - When tapping a dish with options (e.g., Akki Rotti with Coconut Chutney or extra Ragi Mudde for Bassaru), a smooth bottom sheet slides up.
  - Native gesture to drag down and close.
* **Sticky Bottom Cart Bar:**
  - Fixed floating bar at the bottom with high contrast forest green background.
  - Displays: `3 items • ₹245.00` + `View Order / ಮುಂದುವರಿಸಿ →`.
* **Table Session Running Bill:**
  - Diners can view all rounds placed by their table during the dining session.
  - One-tap button: `Request Final Bill / ಬಿಲ್ ಕೇಳಿ`.

---

## 3. High-Contrast Kitchen Display System (Chef KDS)
* **Display Profile:** Tablet / Large Screen Landscape, high contrast mode with dark surface backing (`#181A19`) for kitchen readability through steam and grease.
* **Top Aggregate Ribbon (Inspired by Toast All-Day View):**
  - Sticky header showing cumulative immediate demands across all active tickets:
    `[ 8 x Akki Rotti ] [ 5 x Bassaru ] [ 12 x Bisi Bele Bath ]`
* **Station Ticket Cards:**
  - **Header:** Order #, Channel Badge (`Table 2`, `Phone Pickup 13:30`, `Swiggy Mock`), Elapsed Time.
  - **Timer Urgency Styling:**
    - Green (0 - 50% elapsed)
    - Turmeric Amber (50% - 85% elapsed)
    - Pulsing Chilli Red (>85% elapsed or overdue)
  - **Step-by-Step Cooking Guide:**
    - Active Step card with instruction in Kannada & English.
    - Large 64px tap targets for `Acknowledge Step`, `Next Step`, `Food Safety Check`.
    - Integrated Web Speech API: Toggles audio guidance (`ಕನ್ನಡ ಧ್ವನಿ / English Voice`).
* **Exclusive Equipment Indicator:**
  - Displays active stove lock: `Burner 1: LOCKED (Bassaru Batch #104) — 08:42 remaining`.
  - Tawa 1: `OCCUPIED (Akki Rotti x 2 orders)`.

---

## 4. Cashier POS Desktop / Tablet View
* **Split-Pane Layout (Inspired by Petpooja & Square):**
  - **Left Pane (65%):** Category grid, fast search bar (supports Kannada and English search), touch menu tiles with price and live available portion badges.
  - **Right Pane (35%):** Active order ticket, customer info, portion selector, order type tabs (`Dine-In`, `Takeaway`, `Scheduled Pickup`), line item modifier breakdown, tax & packaging calculation, payment buttons (`Cash`, `UPI QR`, `Card`, `Pay Later`).
* **Order Moderation Bar:**
  - Alert pill for incoming Table QR self-orders awaiting cashier confirmation.
* **Shift Drawer Modal:**
  - Opening cash float, cash additions/drops, and end-of-day expected vs counted cash audit.
