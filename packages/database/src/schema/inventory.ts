import { pgTable, text, timestamp, uuid, integer, numeric } from 'drizzle-orm/pg-core';
import { branches } from './organizations.js';

export const ingredients = pgTable('ingredients', {
  id: text('id').primaryKey(),
  branchId: text('branch_id').references(() => branches.id).notNull(),
  code: text('code').notNull(),
  nameEn: text('name_en').notNull(),
  nameKn: text('name_kn').notNull(),
  category: text('category').notNull(), // GRAIN, PULSE, SPICE, DAIRY, PRODUCE, OIL, PACKAGING
  baseUnit: text('base_unit').notNull(), // g, ml, pcs
  purchaseUnit: text('purchase_unit').notNull(), // kg, l, pcs
  conversionRatioToBase: numeric('conversion_ratio_to_base', { precision: 10, scale: 3 }).notNull(),
  reorderLevel: numeric('reorder_level', { precision: 12, scale: 3 }).notNull(),
  currentStock: numeric('current_stock', { precision: 12, scale: 3 }).default('0').notNull(),
  storageLocation: text('storage_location'),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull()
});

export const stockLots = pgTable('stock_lots', {
  id: text('id').primaryKey(),
  branchId: text('branch_id').references(() => branches.id).notNull(),
  ingredientId: text('ingredient_id').references(() => ingredients.id).notNull(),
  lotNumber: text('lot_number').notNull(),
  initialQuantity: numeric('initial_quantity', { precision: 12, scale: 3 }).notNull(),
  availableQuantity: numeric('available_quantity', { precision: 12, scale: 3 }).notNull(),
  reservedQuantity: numeric('reserved_quantity', { precision: 12, scale: 3 }).default('0').notNull(),
  unitCostPaise: integer('unit_cost_paise').notNull(),
  receivedAt: timestamp('received_at', { withTimezone: true }).defaultNow().notNull(),
  expiresAt: timestamp('expires_at', { withTimezone: true }).notNull(),
  status: text('status').default('AVAILABLE').notNull() // AVAILABLE, RESERVED, DEPLETED, EXPIRED, BLOCKED
});

export const stockMovements = pgTable('stock_movements', {
  id: text('id').primaryKey(),
  branchId: text('branch_id').references(() => branches.id).notNull(),
  ingredientId: text('ingredient_id').references(() => ingredients.id).notNull(),
  lotId: text('lot_id').references(() => stockLots.id),
  movementType: text('movement_type').notNull(), // OPENING, RECEIPT, RESERVATION, USAGE, PACKING_USE, WASTE, ADJUSTMENT, RELEASE
  quantity: numeric('quantity', { precision: 12, scale: 3 }).notNull(),
  unitCostPaise: integer('unit_cost_paise'),
  referenceId: text('reference_id'),
  reason: text('reason'),
  actorUserId: text('actor_user_id'),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull()
});
