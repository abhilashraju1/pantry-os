import { pgTable, text, timestamp, uuid } from 'drizzle-orm/pg-core';
import { branches, users } from './organizations.js';

export const auditEvents = pgTable('audit_events', {
  id: text('id').primaryKey(),
  branchId: text('branch_id').references(() => branches.id).notNull(),
  actorUserId: text('actor_user_id').references(() => users.id),
  action: text('action').notNull(),
  entityType: text('entity_type').notNull(),
  entityId: text('entity_id').notNull(),
  detailsJson: text('details_json'),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull()
});
