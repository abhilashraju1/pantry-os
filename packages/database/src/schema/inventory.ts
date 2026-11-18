import { pgTable, text, timestamp, uuid, integer, numeric } from 'drizzle-orm/pg-core';
import { branches } from './organizations.js';

export const ingredients = pgTable('ingredients', {
  id: uuid('id').defaultRandom().primaryKey(),
  branchId: uuid('branch_id').references(() => branches.id).notNull(),
  code: text('code').notNull(),
  nameEn: text('name_en').notNull(),
  nameKn: text('name_kn').notNull(),
  category: text('category').notNull(),
  baseUnit: text('base_unit').notNull(),
  purchaseUnit: text('purchase_unit').notNull(),
  conversionRatioToBase: numeric('conversion_ratio_to_base', { precision: 10, scale: 3 }).notNull(),
  reorderLevel: numeric('reorder_level', { precision: 12, scale: 3 }).notNull(),
  currentStock: numeric('current_stock', { precision: 12, scale: 3 }).default('0').notNull(),
  storageLocation: text('storage_location'),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull()
});

export const stockLots = pgTable('stock_lots', {
  id: uuid('id').defaultRandom().primaryKey(),
  branchId: uuid('branch_id').references(() => branches.id).notNull(),
  ingredientId: uuid('ingredient_id').references(() => ingredients.id).notNull(),
  lotNumber: text('lot_number').notNull(),
  initialQuantity: numeric('initial_quantity', { precision: 12, scale: 3 }).notNull(),
  availableQuantity: numeric('available_quantity', { precision: 12, scale: 3 }).notNull(),
  reservedQuantity: numeric('reserved_quantity', { precision: 12, scale: 3 }).default('0').notNull(),
  unitCostPaise: integer('unit_cost_paise').notNull(),
  receivedAt: timestamp('received_at', { withTimezone: true }).defaultNow().notNull(),
  expiresAt: timestamp('expires_at', { withTimezone: true }).notNull(),
  status: text('status').default('AVAILABLE').notNull()
});

export const stockMovements = pgTable('stock_movements', {
  id: uuid('id').defaultRandom().primaryKey(),
  branchId: uuid('branch_id').references(() => branches.id).notNull(),
  ingredientId: uuid('ingredient_id').references(() => ingredients.id).notNull(),
  lotId: uuid('lot_id').references(() => stockLots.id),
  movementType: text('movement_type').notNull(),
  quantity: numeric('quantity', { precision: 12, scale: 3 }).notNull(),
  unitCostPaise: integer('unit_cost_paise'),
  referenceId: text('reference_id'),
  actorUserId: uuid('actor_user_id'),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull()
});
