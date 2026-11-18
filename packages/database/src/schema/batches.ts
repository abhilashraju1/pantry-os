import { pgTable, text, timestamp, uuid, numeric } from 'drizzle-orm/pg-core';
import { branches, users } from './organizations.js';
import { recipes, recipeVersions, dishes } from './recipes.js';

export const productionBatches = pgTable('production_batches', {
  id: uuid('id').defaultRandom().primaryKey(),
  branchId: uuid('branch_id').references(() => branches.id).notNull(),
  batchCode: text('batch_code').notNull(),
  recipeVersionId: uuid('recipe_version_id').references(() => recipeVersions.id).notNull(),
  dishId: uuid('dish_id').references(() => dishes.id).notNull(),
  status: text('status').default('PLANNED').notNull(),
  plannedYield: numeric('planned_yield', { precision: 12, scale: 3 }).notNull(),
  actualUsableYield: numeric('actual_usable_yield', { precision: 12, scale: 3 }),
  remainingUsableYield: numeric('remaining_usable_yield', { precision: 12, scale: 3 }),
  yieldUnit: text('yield_unit').notNull(),
  assignedEquipmentId: uuid('assigned_equipment_id'),
  assignedChefId: uuid('assigned_chef_id').references(() => users.id),
  cookedAt: timestamp('cooked_at', { withTimezone: true }),
  expiresAt: timestamp('expires_at', { withTimezone: true }),
  qualityApprovedAt: timestamp('quality_approved_at', { withTimezone: true }),
  qualityApprovedBy: uuid('quality_approved_by').references(() => users.id),
  qualityCoreTemperatureC: numeric('quality_core_temperature_c', { precision: 5, scale: 2 }),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull()
});
