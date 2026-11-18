import { z } from 'zod';

export const OrderChannelSchema = z.enum([
  'WALK_IN_POS',
  'QR_TABLE',
  'PHONE_PICKUP',
  'OWN_WEB',
  'MOCK_ONDC',
  'MOCK_ZOMATO',
  'MOCK_SWIGGY'
]);
export type OrderChannel = z.infer<typeof OrderChannelSchema>;

export const OrderStatusSchema = z.enum([
  'DRAFT',
  'PLACED',
  'ACCEPTED',
  'SCHEDULED',
  'PREPARING',
  'READY_FOR_PACKING',
  'PACKED',
  'READY_FOR_PICKUP',
  'SERVED',
  'COMPLETED',
  'CANCELLED'
]);
export type OrderStatus = z.infer<typeof OrderStatusSchema>;

export const OrderItemRequestSchema = z.object({
  dishVariantId: z.string().uuid(),
  quantity: z.number().int().positive(),
  specialInstructions: z.string().optional()
});
export type OrderItemRequest = z.infer<typeof OrderItemRequestSchema>;

export const OrderItemSchema = z.object({
  id: z.string().uuid(),
  orderId: z.string().uuid(),
  dishId: z.string().uuid(),
  dishNameEn: z.string(),
  dishNameKn: z.string(),
  variantId: z.string().uuid(),
  variantNameEn: z.string(),
  variantNameKn: z.string(),
  quantity: z.number().int().positive(),
  unitPricePaise: z.number().int().positive(),
  subtotalPaise: z.number().int().positive(),
  specialInstructions: z.string().optional(),
  allocatedBatchId: z.string().uuid().nullable(),
  status: z.enum(['PENDING', 'PREPARING', 'READY', 'PACKED', 'SERVED'])
});
export type OrderItem = z.infer<typeof OrderItemSchema>;

export const CreateOrderRequestSchema = z.object({
  channel: OrderChannelSchema,
  tableSessionToken: z.string().optional(),
  customerName: z.string().optional(),
  customerPhone: z.string().optional(),
  requestedPickupAt: z.string().datetime().optional(),
  items: z.array(OrderItemRequestSchema).min(1),
  notes: z.string().optional()
});
export type CreateOrderRequest = z.infer<typeof CreateOrderRequestSchema>;

export const OrderSchema = z.object({
  id: z.string().uuid(),
  orderNumber: z.string(),
  branchId: z.string().uuid(),
  channel: OrderChannelSchema,
  status: OrderStatusSchema,
  tableId: z.string().uuid().nullable(),
  tableNumber: z.string().nullable(),
  customerName: z.string().nullable(),
  customerPhone: z.string().nullable(),
  items: z.array(OrderItemSchema),
  subtotalPaise: z.number().int().nonnegative(),
  taxPaise: z.number().int().nonnegative(),
  packagingFeePaise: z.number().int().nonnegative(),
  totalPaise: z.number().int().nonnegative(),
  paymentStatus: z.enum(['UNPAID', 'PENDING', 'PAID', 'PARTIALLY_REFUNDED', 'REFUNDED', 'FAILED']),
  requestedPickupAt: z.string().datetime().nullable(),
  promisedReadyAt: z.string().datetime().nullable(),
  placedAt: z.string().datetime(),
  completedAt: z.string().datetime().nullable(),
  notes: z.string().nullable()
});
export type Order = z.infer<typeof OrderSchema>;
