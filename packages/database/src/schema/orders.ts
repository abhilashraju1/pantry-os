import { pgTable, text, timestamp, uuid, integer } from 'drizzle-orm/pg-core';
import { branches, users } from './organizations.js';
import { dishes, dishVariants } from './recipes.js';
import { productionBatches } from './batches.js';

export const diningTables = pgTable('dining_tables', {
  id: text('id').primaryKey(),
  branchId: text('branch_id').references(() => branches.id).notNull(),
  tableNumber: text('table_number').notNull(),
  qrToken: text('qr_token').notNull().unique(),
  seatingCapacity: integer('seating_capacity').notNull(),
  status: text('status').default('AVAILABLE').notNull()
});

export const tableSessions = pgTable('table_sessions', {
  id: text('id').primaryKey(),
  branchId: text('branch_id').references(() => branches.id).notNull(),
  tableId: text('table_id').references(() => diningTables.id).notNull(),
  sessionToken: text('session_token').notNull().unique(),
  status: text('status').default('ACTIVE').notNull(), // ACTIVE, BILL_REQUESTED, CLOSED
  openedAt: timestamp('opened_at', { withTimezone: true }).defaultNow().notNull(),
  billRequestedAt: timestamp('bill_requested_at', { withTimezone: true }),
  billAcknowledgedAt: timestamp('bill_acknowledged_at', { withTimezone: true }),
  billAcknowledgedByUserId: text('bill_acknowledged_by_user_id').references(() => users.id),
  closedAt: timestamp('closed_at', { withTimezone: true })
});

export const orders = pgTable('orders', {
  id: text('id').primaryKey(),
  branchId: text('branch_id').references(() => branches.id).notNull(),
  orderNumber: text('order_number').notNull().unique(),
  channel: text('channel').notNull(), // POS, QR, PICKUP, ONDC, SWIGGY, ZOMATO
  status: text('status').default('DRAFT').notNull(), // DRAFT, ACCEPTED, PREPARING, READY, PACKED, COMPLETED, CANCELLED
  tableId: text('table_id').references(() => diningTables.id),
  tableSessionId: text('table_session_id').references(() => tableSessions.id),
  customerName: text('customer_name'),
  customerPhone: text('customer_phone'),
  subtotalPaise: integer('subtotal_paise').notNull(),
  taxPaise: integer('tax_paise').notNull(),
  packagingFeePaise: integer('packaging_fee_paise').default(0).notNull(),
  totalPaise: integer('total_paise').notNull(),
  paymentStatus: text('payment_status').default('UNPAID').notNull(), // UNPAID, PENDING, PAID, REFUNDED
  requestedPickupAt: timestamp('requested_pickup_at', { withTimezone: true }),
  promisedReadyAt: timestamp('promised_ready_at', { withTimezone: true }),
  placedAt: timestamp('placed_at', { withTimezone: true }).defaultNow().notNull(),
  completedAt: timestamp('completed_at', { withTimezone: true }),
  notes: text('notes')
});

export const orderItems = pgTable('order_items', {
  id: text('id').primaryKey(),
  orderId: text('order_id').references(() => orders.id).notNull(),
  dishId: text('dish_id').references(() => dishes.id).notNull(),
  variantId: text('variant_id').references(() => dishVariants.id).notNull(),
  quantity: integer('quantity').notNull(),
  unitPricePaise: integer('unit_price_paise').notNull(),
  subtotalPaise: integer('subtotal_paise').notNull(),
  specialInstructions: text('special_instructions'),
  allocatedBatchId: text('allocated_batch_id').references(() => productionBatches.id),
  status: text('status').default('PENDING').notNull()
});
