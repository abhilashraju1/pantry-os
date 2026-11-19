import { z } from 'zod';

export const PaymentMethodSchema = z.enum([
  'CASH',
  'UPI_QR',
  'CARD',
  'ONLINE_GATEWAY',
  'MOCK_AGGREGATOR'
]);
export type PaymentMethod = z.infer<typeof PaymentMethodSchema>;

export const PaymentStatusSchema = z.enum([
  'UNPAID',
  'PENDING',
  'PAID',
  'PARTIALLY_REFUNDED',
  'REFUNDED',
  'FAILED'
]);
export type PaymentStatus = z.infer<typeof PaymentStatusSchema>;

export const RecordPaymentRequestSchema = z.object({
  orderId: z.string().min(1),
  amountPaise: z.number().int().positive(),
  method: PaymentMethodSchema,
  transactionRef: z.string().optional()
});
export type RecordPaymentRequest = z.infer<typeof RecordPaymentRequestSchema>;

export const CashSessionSchema = z.object({
  id: z.string().min(1),
  branchId: z.string().min(1),
  cashierUserId: z.string().min(1),
  cashierName: z.string(),
  openingCashPaise: z.number().int().nonnegative(),
  expectedCashPaise: z.number().int().nonnegative(),
  closingCashPaise: z.number().int().nonnegative().nullable(),
  variancePaise: z.number().int().nullable(),
  openedAt: z.string().datetime(),
  closedAt: z.string().datetime().nullable(),
  notes: z.string().nullable()
});
export type CashSession = z.infer<typeof CashSessionSchema>;

export const CloseCashSessionRequestSchema = z.object({
  countedCashPaise: z.number().int().nonnegative(),
  notes: z.string().optional()
});
export type CloseCashSessionRequest = z.infer<typeof CloseCashSessionRequestSchema>;
