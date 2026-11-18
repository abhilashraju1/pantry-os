/**
 * Decimal-safe currency calculations in Paise (1 INR = 100 Paise)
 */

export const GST_RATE_PERCENT = 5; // Configurable default 5% GST for food service

export function formatINR(paise: number): string {
  const inr = (paise / 100).toFixed(2);
  return `₹${inr}`;
}

export function calculateGST(taxableSubtotalPaise: number, ratePercent: number = GST_RATE_PERCENT): number {
  if (taxableSubtotalPaise <= 0) return 0;
  return Math.round((taxableSubtotalPaise * ratePercent) / 100);
}

export function calculateOrderTotals(params: {
  itemSubtotalPaise: number;
  packagingFeePaise?: number;
  discountPaise?: number;
  gstRatePercent?: number;
}) {
  const {
    itemSubtotalPaise,
    packagingFeePaise = 0,
    discountPaise = 0,
    gstRatePercent = GST_RATE_PERCENT
  } = params;

  const discountedSubtotal = Math.max(0, itemSubtotalPaise - discountPaise);
  const tax = calculateGST(discountedSubtotal, gstRatePercent);
  const total = discountedSubtotal + packagingFeePaise + tax;

  return {
    subtotalPaise: itemSubtotalPaise,
    discountPaise,
    packagingFeePaise,
    taxPaise: tax,
    totalPaise: total
  };
}
