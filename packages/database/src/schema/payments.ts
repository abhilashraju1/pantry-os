import { pgTable, text, timestamp, uuid, integer } from 'drizzle-orm/pg-core';
import { branches, users } from './organizations.js';
import { orders } from './orders.js';

export const payments = pgTable('payments', {
  id: uuid('id').defaultRandom().primaryKey(),
  branchId: uuid('branch_id').references(() => branches.id).notNull(),
  orderId: uuid('order_id').references(() => orders.id).notNull(),
  amountPaise: integer('amount_paise').notNull(),
  method: text('method').notNull(),
  status: text('status').default('PENDING').notNull(),
  transactionRef: text('transaction_ref'),
  verifiedAt: timestamp('verified_at', { withTimezone: true }),
  verifiedByUserId: uuid('verified_by_user_id').references(() => users.id),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull()
});

export const cashSessions = pgTable('cash_sessions', {
  id: uuid('id').defaultRandom().primaryKey(),
  branchId: uuid('branch_id').references(() => branches.id).notNull(),
  cashierUserId: uuid('cashier_user_id').references(() => users.id).notNull(),
  openingCashPaise: integer('opening_cash_paise').notNull(),
  closingCashPaise: integer('closing_cash_paise'),
  countedCashPaise: integer('counted_cash_paise'),
  variancePaise: integer('variance_paise'),
  openedAt: timestamp('opened_at', { withTimezone: true }).defaultNow().notNull(),
  closedAt: timestamp('closed_at', { withTimezone: true }),
  notes: text('notes')
});
