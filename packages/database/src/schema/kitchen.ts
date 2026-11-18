import { pgTable, text, timestamp, uuid, boolean } from 'drizzle-orm/pg-core';
import { branches } from './organizations.js';

export const kitchenStations = pgTable('kitchen_stations', {
  id: uuid('id').defaultRandom().primaryKey(),
  branchId: uuid('branch_id').references(() => branches.id).notNull(),
  nameEn: text('name_en').notNull(),
  nameKn: text('name_kn').notNull(),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull()
});

export const kitchenEquipment = pgTable('kitchen_equipment', {
  id: uuid('id').defaultRandom().primaryKey(),
  branchId: uuid('branch_id').references(() => branches.id).notNull(),
  stationId: uuid('station_id').references(() => kitchenStations.id).notNull(),
  code: text('code').notNull(),
  nameEn: text('name_en').notNull(),
  nameKn: text('name_kn').notNull(),
  type: text('type').notNull(),
  status: text('status').default('AVAILABLE').notNull(),
  isExclusive: boolean('is_exclusive').default(true).notNull(),
  currentTaskId: uuid('current_task_id'),
  lockedUntil: timestamp('locked_until', { withTimezone: true })
});
