# PANTRYOS — FOOD SAFETY, TEMPERATURE LOGS & QUALITY SIGN-OFF
**Version:** 1.0 | **Date:** 17 November 2026 | **Status:** Phase 0 Approved

---

## 1. Regulatory Baseline (FSSAI Guidance)
Under Food Safety and Standards Authority of India (FSSAI) guidelines for cooked vegetarian food service:
* Hot cooked food must be maintained above **60°C (140°F)** during holding and distribution.
* Food held between 5°C and 60°C is within the temperature danger zone and must not be served if held beyond 2 hours without cooling/reheating protocols.
* **Non-Negotiable Software Rule:** Timer expiration on a kitchen display **never** automatically certifies food safety or changes batch state to `READY`. A qualified human chef must physically verify doneness and sign off on quality and temperature.

---

## 2. Quality Check Verification Flow
1. **Cooking Timer Completion:**
   - Burner countdown reaches 00:00.
   - Screen displays amber alert: *"Cooking completed. Quality check required."*
   - Audio chime sounds; Web Speech TTS announces in Kannada/English: *"ಬಸ್ಸಾರು ಅಡುಗೆ ಮುಗಿದಿದೆ. ದಯವಿಟ್ಟು ಪರಿಶೀಲಿಸಿ."*
2. **Chef Inspection Steps:**
   - [ ] Sensory check (Color, aroma, consistency).
   - [ ] Core temperature measurement (e.g. 75°C - 85°C logged into digital form).
   - [ ] Actual usable yield weighed on digital kitchen scale and entered in grams/ml.
3. **Supervisor Sign-off:**
   - Tap `[ Approve & Release for Service ]`.
   - The batch moves to `READY` / `HOLDING`, and portions become available on customer QR menus and POS tiles.
4. **Holding Expiry Alert:**
   - A 4-hour background timer is registered in BullMQ.
   - At 3.5 hours, an amber warning appears on the KDS and Manager overview: *"Batch #104 expiring in 30 mins."*
   - At 4.0 hours, the batch automatically transitions to `EXPIRED`. Further order allocations are locked out by the availability engine.
