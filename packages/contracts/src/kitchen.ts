import { z } from 'zod';

export const EquipmentTypeSchema = z.enum([
  'GAS_STOVE',
  'TAWA',
  'PREP_TABLE',
  'VESSEL',
  'WARMER'
]);
export type EquipmentType = z.infer<typeof EquipmentTypeSchema>;

export const EquipmentStatusSchema = z.enum([
  'AVAILABLE',
  'OCCUPIED',
  'MAINTENANCE'
]);
export type EquipmentStatus = z.infer<typeof EquipmentStatusSchema>;

export const EquipmentSchema = z.object({
  id: z.string().min(1),
  code: z.string(),
  nameEn: z.string(),
  nameKn: z.string(),
  stationId: z.string().min(1),
  stationNameEn: z.string(),
  type: EquipmentTypeSchema,
  status: EquipmentStatusSchema,
  isExclusive: z.boolean().default(true),
  currentTaskId: z.string().min(1).nullable(),
  lockedUntil: z.string().datetime().nullable()
});
export type Equipment = z.infer<typeof EquipmentSchema>;

export const AcquireEquipmentLockRequestSchema = z.object({
  equipmentId: z.string().min(1),
  taskId: z.string().min(1),
  durationSeconds: z.number().int().positive()
});
export type AcquireEquipmentLockRequest = z.infer<typeof AcquireEquipmentLockRequestSchema>;
