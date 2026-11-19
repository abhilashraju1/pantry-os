import { pgTable, text, timestamp, uuid, numeric, integer } from 'drizzle-orm/pg-core';
import { branches, users } from './organizations.js';
import { recipes, recipeVersions, dishes } from './recipes.js';

export const productionBatches = pgTable('production_batches', {
  id: text('id').primaryKey(),
  branchId: text('branch_id').references(() => branches.id).notNull(),
  batchCode: text('batch_code').notNull(),
  recipeVersionId: text('recipe_version_id').references(() => recipeVersions.id).notNull(),
  dishId: text('dish_id').references(() => dishes.id).notNull(),
  status: text('status').default('PLANNED').notNull(), // PLANNED, COOKING, READY, EXPIRED, DEPLETED
  plannedYield: numeric('planned_yield', { precision: 12, scale: 3 }).notNull(),
  actualUsableYield: numeric('actual_usable_yield', { precision: 12, scale: 3 }),
  remainingUsableYield: numeric('remaining_usable_yield', { precision: 12, scale: 3 }),
  yieldUnit: text('yield_unit').notNull(),
  assignedEquipmentId: text('assigned_equipment_id'),
  assignedChefId: text('assigned_chef_id').references(() => users.id),
  cookedAt: timestamp('cooked_at', { withTimezone: true }),
  expiresAt: timestamp('expires_at', { withTimezone: true }),
  qualityApprovedAt: timestamp('quality_approved_at', { withTimezone: true }),
  qualityApprovedBy: text('quality_approved_by').references(() => users.id),
  qualityCoreTemperatureC: numeric('quality_core_temperature_c', { precision: 5, scale: 2 }),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull()
});

export const batchReservations = pgTable('batch_reservations', {
  id: text('id').primaryKey(),
  batchId: text('batch_id').references(() => productionBatches.id).notNull(),
  orderItemId: text('order_item_id').notNull(),
  portionsReserved: integer('portions_reserved').notNull(),
  quantityDeducted: numeric('quantity_deducted', { precision: 12, scale: 3 }).notNull(),
  unit: text('unit').notNull(),
  status: text('status').default('RESERVED').notNull(), // RESERVED, FULFILLED, RELEASED
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull()
});
