import { pgTable, text, timestamp, uuid, integer } from 'drizzle-orm/pg-core';
import { branches } from './organizations.js';
import { dishes, dishVariants } from './recipes.js';
import { productionBatches } from './batches.js';

export const diningTables = pgTable('dining_tables', {
  id: uuid('id').defaultRandom().primaryKey(),
  branchId: uuid('branch_id').references(() => branches.id).notNull(),
  tableNumber: text('table_number').notNull(),
  qrToken: text('qr_token').notNull().unique(),
  seatingCapacity: integer('seating_capacity').notNull(),
  status: text('status').default('AVAILABLE').notNull()
});

export const orders = pgTable('orders', {
  id: uuid('id').defaultRandom().primaryKey(),
  branchId: uuid('branch_id').references(() => branches.id).notNull(),
  orderNumber: text('order_number').notNull().unique(),
  channel: text('channel').notNull(),
  status: text('status').default('DRAFT').notNull(),
  tableId: uuid('table_id').references(() => diningTables.id),
  customerName: text('customer_name'),
  customerPhone: text('customer_phone'),
  subtotalPaise: integer('subtotal_paise').notNull(),
  taxPaise: integer('tax_paise').notNull(),
  packagingFeePaise: integer('packaging_fee_paise').default(0).notNull(),
  totalPaise: integer('total_paise').notNull(),
  paymentStatus: text('payment_status').default('UNPAID').notNull(),
  requestedPickupAt: timestamp('requested_pickup_at', { withTimezone: true }),
  promisedReadyAt: timestamp('promised_ready_at', { withTimezone: true }),
  placedAt: timestamp('placed_at', { withTimezone: true }).defaultNow().notNull(),
  completedAt: timestamp('completed_at', { withTimezone: true }),
  notes: text('notes')
});

export const orderItems = pgTable('order_items', {
  id: uuid('id').defaultRandom().primaryKey(),
  orderId: uuid('order_id').references(() => orders.id).notNull(),
  dishId: uuid('dish_id').references(() => dishes.id).notNull(),
  variantId: uuid('variant_id').references(() => dishVariants.id).notNull(),
  quantity: integer('quantity').notNull(),
  unitPricePaise: integer('unit_price_paise').notNull(),
  subtotalPaise: integer('subtotal_paise').notNull(),
  specialInstructions: text('special_instructions'),
  allocatedBatchId: uuid('allocated_batch_id').references(() => productionBatches.id),
  status: text('status').default('PENDING').notNull()
});
