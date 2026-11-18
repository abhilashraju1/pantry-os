import { z } from 'zod';
import { OrderSchema } from './orders.js';
import { ProductionBatchSchema } from './batches.js';
import { EquipmentSchema } from './kitchen.js';

export const WSEventTypeSchema = z.enum([
  'ORDER_CREATED',
  'ORDER_STATUS_CHANGED',
  'BATCH_UPDATED',
  'EQUIPMENT_LOCK_CHANGED',
  'KITCHEN_TIMER_TICK',
  'ITEM_AVAILABILITY_CHANGED'
]);
export type WSEventType = z.infer<typeof WSEventTypeSchema>;

export const WSEventEnvelopeSchema = z.object({
  type: WSEventTypeSchema,
  branchId: z.string().uuid(),
  timestamp: z.string().datetime(),
  payload: z.record(z.unknown())
});
export type WSEventEnvelope = z.infer<typeof WSEventEnvelopeSchema>;
