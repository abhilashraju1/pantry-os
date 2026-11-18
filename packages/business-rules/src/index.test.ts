import { describe, it, expect } from 'vitest';
import {
  calculateGST,
  calculateOrderTotals,
  formatINR,
  convertToBaseUnit,
  calculateMaxPortions,
  calculateRemainingPortions,
  validateEquipmentLock,
  calculateKitchenFireTime,
  canTransitionOrder,
  canTransitionBatch
} from './index.js';

describe('Business Rules - Money & GST', () => {
  it('formats INR correctly from paise', () => {
    expect(formatINR(6500)).toBe('₹65.00');
    expect(formatINR(9050)).toBe('₹90.50');
  });

  it('calculates 5% GST correctly on food items', () => {
    // ₹100.00 (10000 paise) * 5% = 500 paise (₹5.00)
    expect(calculateGST(10000, 5)).toBe(500);
    // ₹65.00 (6500 paise) * 5% = 325 paise (₹3.25)
    expect(calculateGST(6500, 5)).toBe(325);
  });

  it('calculates order totals with packaging and discount', () => {
    const totals = calculateOrderTotals({
      itemSubtotalPaise: 6500, // ₹65.00
      packagingFeePaise: 400,  // ₹4.00
      discountPaise: 500,      // ₹5.00 off
      gstRatePercent: 5
    });
    // Taxable = 6000 paise, Tax = 300 paise
    // Total = 6000 + 400 + 300 = 6700 paise (₹67.00)
    expect(totals.taxPaise).toBe(300);
    expect(totals.totalPaise).toBe(6700);
  });
});

describe('Business Rules - Unit Conversions', () => {
  it('converts kg to g and l to ml', () => {
    expect(convertToBaseUnit(1.5, 'kg')).toEqual({ baseQuantity: 1500, baseUnit: 'g' });
    expect(convertToBaseUnit(2, 'l')).toEqual({ baseQuantity: 2000, baseUnit: 'ml' });
    expect(convertToBaseUnit(250, 'g')).toEqual({ baseQuantity: 250, baseUnit: 'g' });
  });
});

describe('Business Rules - Batch Portions', () => {
  it('calculates portions from actual usable yield correctly', () => {
    // 3000g cooked yield of Bisi Bele Bath / 300g per portion = 10 portions
    expect(calculateMaxPortions(3000, 300)).toBe(10);
    // 3120g yield / 300g = 10 portions (with 120g margin)
    expect(calculateMaxPortions(3120, 300)).toBe(10);
    // 2900g yield / 300g = 9 portions
    expect(calculateMaxPortions(2900, 300)).toBe(9);
  });

  it('tracks remaining and reserved portions without double counting', () => {
    const res = calculateRemainingPortions({
      actualUsableYield: 3000,
      portionSize: 300,
      alreadyReservedPortions: 3
    });
    expect(res.totalPortions).toBe(10);
    expect(res.reservedPortions).toBe(3);
    expect(res.availablePortions).toBe(7);
    expect(res.remainingYield).toBe(2100);
  });
});

describe('Business Rules - Stove Lock & Capacity', () => {
  it('prevents overlapping exclusive equipment assignment', () => {
    const now = new Date();
    const tenMinutesLater = new Date(now.getTime() + 10 * 60 * 1000);

    const locks = [
      {
        taskId: 'task-1',
        equipmentId: 'eq-tawa-1',
        startedAt: now,
        lockedUntil: tenMinutesLater
      }
    ];

    // Attempting to lock the same tawa while active must fail
    const check1 = validateEquipmentLock('eq-tawa-1', locks, now);
    expect(check1.canAcquire).toBe(false);
    expect(check1.conflictingTask?.taskId).toBe('task-1');

    // Locking a different burner must succeed
    const check2 = validateEquipmentLock('eq-burner-2', locks, now);
    expect(check2.canAcquire).toBe(true);
  });
});

describe('Business Rules - State Machines', () => {
  it('validates allowed order transitions', () => {
    expect(canTransitionOrder('DRAFT', 'PLACED')).toBe(true);
    expect(canTransitionOrder('PLACED', 'ACCEPTED')).toBe(true);
    expect(canTransitionOrder('ACCEPTED', 'PREPARING')).toBe(true);
    expect(canTransitionOrder('PREPARING', 'READY_FOR_PACKING')).toBe(true);
    expect(canTransitionOrder('READY_FOR_PACKING', 'PACKED')).toBe(true);
    expect(canTransitionOrder('PACKED', 'SERVED')).toBe(true);
    expect(canTransitionOrder('SERVED', 'COMPLETED')).toBe(true);

    // Invalid transition: cannot jump from PLACED directly to COMPLETED
    expect(canTransitionOrder('PLACED', 'COMPLETED')).toBe(false);
  });

  it('validates allowed batch transitions', () => {
    expect(canTransitionBatch('PLANNED', 'INGREDIENTS_RESERVED')).toBe(true);
    expect(canTransitionBatch('QUALITY_CHECK', 'READY')).toBe(true);
    expect(canTransitionBatch('READY', 'EXPIRED')).toBe(true);
    // Invalid transition: cannot jump from PLANNED to READY without cooking and quality check
    expect(canTransitionBatch('PLANNED', 'READY')).toBe(false);
  });
});
