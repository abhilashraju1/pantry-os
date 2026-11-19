import { pgTable, text, timestamp, uuid, boolean, integer, numeric } from 'drizzle-orm/pg-core';
import { branches, users } from './organizations.js';
import { dishes, recipeVersions } from './recipes.js';
import { productionBatches } from './batches.js';

export const kitchenStations = pgTable('kitchen_stations', {
  id: text('id').primaryKey(),
  branchId: text('branch_id').references(() => branches.id).notNull(),
  nameEn: text('name_en').notNull(),
  nameKn: text('name_kn').notNull(),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull()
});

export const kitchenEquipment = pgTable('kitchen_equipment', {
  id: text('id').primaryKey(),
  branchId: text('branch_id').references(() => branches.id).notNull(),
  stationId: text('station_id').references(() => kitchenStations.id).notNull(),
  code: text('code').notNull(),
  nameEn: text('name_en').notNull(),
  nameKn: text('name_kn').notNull(),
  type: text('type').notNull(), // STOVE, TAWA, WARMER, PREP
  status: text('status').default('AVAILABLE').notNull(), // AVAILABLE, OCCUPIED, MAINTENANCE
  isExclusive: boolean('is_exclusive').default(true).notNull(),
  currentTaskId: text('current_task_id'),
  lockedUntil: timestamp('locked_until', { withTimezone: true })
});

export const cookingTasks = pgTable('cooking_tasks', {
  id: text('id').primaryKey(),
  branchId: text('branch_id').references(() => branches.id).notNull(),
  equipmentId: text('equipment_id').references(() => kitchenEquipment.id).notNull(),
  dishId: text('dish_id').references(() => dishes.id).notNull(),
  recipeVersionId: text('recipe_version_id').references(() => recipeVersions.id).notNull(),
  batchId: text('batch_id').references(() => productionBatches.id),
  orderItemId: text('order_item_id'),
  chefUserId: text('chef_user_id').references(() => users.id),
  status: text('status').default('SCHEDULED').notNull(), // SCHEDULED, IN_PROGRESS, PAUSED, COMPLETED, CANCELLED
  currentStepOrder: integer('current_step_order').default(1).notNull(),
  currentStepStartedAt: timestamp('current_step_started_at', { withTimezone: true }),
  lockedUntil: timestamp('locked_until', { withTimezone: true }),
  startedAt: timestamp('started_at', { withTimezone: true }),
  completedAt: timestamp('completed_at', { withTimezone: true }),
  qualityCheckTempC: numeric('quality_check_temp_c', { precision: 5, scale: 2 }),
  qualityCheckPassed: boolean('quality_check_passed'),
  qualityCheckedByUserId: text('quality_checked_by_user_id').references(() => users.id),
  notes: text('notes'),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull()
});
