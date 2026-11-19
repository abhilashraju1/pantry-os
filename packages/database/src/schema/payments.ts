import { pgTable, text, timestamp, uuid, integer } from 'drizzle-orm/pg-core';
import { branches, users } from './organizations.js';
import { orders } from './orders.js';

export const cashSessions = pgTable('cash_sessions', {
  id: text('id').primaryKey(),
  branchId: text('branch_id').references(() => branches.id).notNull(),
  cashierUserId: text('cashier_user_id').references(() => users.id).notNull(),
  openingCashPaise: integer('opening_cash_paise').notNull(),
  closingCashPaise: integer('closing_cash_paise'),
  countedCashPaise: integer('counted_cash_paise'),
  variancePaise: integer('variance_paise'),
  openedAt: timestamp('opened_at', { withTimezone: true }).defaultNow().notNull(),
  closedAt: timestamp('closed_at', { withTimezone: true }),
  notes: text('notes')
});

export const payments = pgTable('payments', {
  id: text('id').primaryKey(),
  branchId: text('branch_id').references(() => branches.id).notNull(),
  orderId: text('order_id').references(() => orders.id).notNull(),
  cashSessionId: text('cash_session_id').references(() => cashSessions.id),
  amountPaise: integer('amount_paise').notNull(),
  method: text('method').notNull(), // CASH, UPI, CARD
  status: text('status').default('PENDING').notNull(), // PENDING, PAID, REFUNDED, FAILED
  transactionRef: text('transaction_ref'),
  gatewayEventId: text('gateway_event_id'),
  verifiedAt: timestamp('verified_at', { withTimezone: true }),
  verifiedByUserId: text('verified_by_user_id').references(() => users.id),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull()
});
