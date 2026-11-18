import { OrderStatus, BatchStatus, PaymentStatus } from '@pantryos/contracts';

/**
 * State Transition Guard Rules
 */

const ORDER_TRANSITIONS: Record<OrderStatus, OrderStatus[]> = {
  DRAFT: ['PLACED', 'CANCELLED'],
  PLACED: ['ACCEPTED', 'CANCELLED'],
  ACCEPTED: ['SCHEDULED', 'PREPARING', 'CANCELLED'],
  SCHEDULED: ['PREPARING', 'CANCELLED'],
  PREPARING: ['READY_FOR_PACKING', 'CANCELLED'],
  READY_FOR_PACKING: ['PACKED', 'CANCELLED'],
  PACKED: ['READY_FOR_PICKUP', 'SERVED', 'CANCELLED'],
  READY_FOR_PICKUP: ['COMPLETED', 'CANCELLED'],
  SERVED: ['COMPLETED', 'CANCELLED'],
  COMPLETED: [],
  CANCELLED: []
};

export function canTransitionOrder(current: OrderStatus, next: OrderStatus): boolean {
  return ORDER_TRANSITIONS[current]?.includes(next) ?? false;
}

const BATCH_TRANSITIONS: Record<BatchStatus, BatchStatus[]> = {
  PLANNED: ['INGREDIENTS_RESERVED', 'CANCELLED'],
  INGREDIENTS_RESERVED: ['PREPARING', 'CANCELLED'],
  PREPARING: ['COOKING', 'CANCELLED'],
  COOKING: ['QUALITY_CHECK', 'CANCELLED'],
  QUALITY_CHECK: ['READY', 'CANCELLED'],
  READY: ['HOLDING', 'EXHAUSTED', 'EXPIRED'],
  HOLDING: ['EXHAUSTED', 'EXPIRED'],
  EXHAUSTED: [],
  EXPIRED: [],
  CANCELLED: []
};

export function canTransitionBatch(current: BatchStatus, next: BatchStatus): boolean {
  return BATCH_TRANSITIONS[current]?.includes(next) ?? false;
}

const PAYMENT_TRANSITIONS: Record<PaymentStatus, PaymentStatus[]> = {
  UNPAID: ['PENDING', 'PAID', 'FAILED'],
  PENDING: ['PAID', 'FAILED'],
  PAID: ['PARTIALLY_REFUNDED', 'REFUNDED'],
  PARTIALLY_REFUNDED: ['REFUNDED'],
  REFUNDED: [],
  FAILED: ['UNPAID', 'PENDING']
};

export function canTransitionPayment(current: PaymentStatus, next: PaymentStatus): boolean {
  return PAYMENT_TRANSITIONS[current]?.includes(next) ?? false;
}
