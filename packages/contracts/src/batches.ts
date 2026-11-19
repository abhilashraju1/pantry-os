import { z } from 'zod';
import { UnitCodeSchema } from './inventory.js';

export const BatchStatusSchema = z.enum([
  'PLANNED',
  'INGREDIENTS_RESERVED',
  'PREPARING',
  'COOKING',
  'QUALITY_CHECK',
  'READY',
  'HOLDING',
  'EXHAUSTED',
  'EXPIRED',
  'CANCELLED'
]);
export type BatchStatus = z.infer<typeof BatchStatusSchema>;

export const ProductionBatchSchema = z.object({
  id: z.string().min(1),
  batchCode: z.string(),
  branchId: z.string().min(1),
  recipeVersionId: z.string().min(1),
  dishId: z.string().min(1),
  status: BatchStatusSchema,
  plannedYield: z.number().positive(),
  actualUsableYield: z.number().nonnegative().nullable(),
  remainingUsableYield: z.number().nonnegative().nullable(),
  yieldUnit: UnitCodeSchema,
  assignedEquipmentId: z.string().min(1).nullable(),
  assignedChefId: z.string().min(1).nullable(),
  currentStepId: z.string().min(1).nullable(),
  stepStartedAt: z.string().datetime().nullable(),
  cookedAt: z.string().datetime().nullable(),
  expiresAt: z.string().datetime().nullable(),
  qualityApprovedAt: z.string().datetime().nullable(),
  qualityApprovedBy: z.string().min(1).nullable(),
  qualityCoreTemperatureC: z.number().nullable(),
  createdAt: z.string().datetime()
});
export type ProductionBatch = z.infer<typeof ProductionBatchSchema>;

export const PlanBatchRequestSchema = z.object({
  recipeVersionId: z.string().min(1),
  dishId: z.string().min(1),
  plannedYield: z.number().positive(),
  assignedEquipmentId: z.string().min(1).optional(),
  assignedChefId: z.string().min(1).optional()
});
export type PlanBatchRequest = z.infer<typeof PlanBatchRequestSchema>;

export const QualitySignoffRequestSchema = z.object({
  actualUsableYield: z.number().positive(),
  coreTemperatureC: z.number().min(50).max(100),
  sensoryCheckPassed: z.boolean(),
  notes: z.string().optional()
});
export type QualitySignoffRequest = z.infer<typeof QualitySignoffRequestSchema>;
