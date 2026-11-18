import { z } from 'zod';

export const UnitCodeSchema = z.enum(['g', 'kg', 'ml', 'l', 'pcs', 'pack']);
export type UnitCode = z.infer<typeof UnitCodeSchema>;

export const IngredientCategorySchema = z.enum([
  'GRAINS',
  'PULSES',
  'FLOURS',
  'VEGETABLES',
  'PERISHABLES',
  'SPICES',
  'OILS',
  'CONDIMENTS',
  'SEASONING',
  'PACKAGING'
]);
export type IngredientCategory = z.infer<typeof IngredientCategorySchema>;

export const IngredientSchema = z.object({
  id: z.string().uuid(),
  code: z.string(),
  nameEn: z.string(),
  nameKn: z.string(),
  category: IngredientCategorySchema,
  baseUnit: UnitCodeSchema,
  purchaseUnit: UnitCodeSchema,
  conversionRatioToBase: z.number().positive(),
  reorderLevel: z.number().nonnegative(),
  currentStock: z.number().nonnegative(),
  storageLocation: z.string().optional()
});
export type Ingredient = z.infer<typeof IngredientSchema>;

export const StockLotSchema = z.object({
  id: z.string().uuid(),
  lotNumber: z.string(),
  ingredientId: z.string().uuid(),
  initialQuantity: z.number().positive(),
  availableQuantity: z.number().nonnegative(),
  reservedQuantity: z.number().nonnegative(),
  unitCostPaise: z.number().int().nonnegative(),
  receivedAt: z.string().datetime(),
  expiresAt: z.string().datetime(),
  status: z.enum(['AVAILABLE', 'DEPLETED', 'EXPIRED', 'QUARANTINED'])
});
export type StockLot = z.infer<typeof StockLotSchema>;

export const GoodsReceiptRequestSchema = z.object({
  supplierId: z.string().uuid(),
  ingredientId: z.string().uuid(),
  quantity: z.number().positive(),
  unitCostPaise: z.number().int().positive(),
  lotNumber: z.string().min(1),
  expiresAt: z.string().datetime()
});
export type GoodsReceiptRequest = z.infer<typeof GoodsReceiptRequestSchema>;

export const StockWastageRequestSchema = z.object({
  ingredientId: z.string().uuid(),
  lotId: z.string().uuid().optional(),
  quantity: z.number().positive(),
  reasonCode: z.enum(['SPOILED', 'EXPIRED', 'DROPPED', 'QUALITY_REJECT', 'AUDIT_DISCREPANCY']),
  notes: z.string().optional()
});
export type StockWastageRequest = z.infer<typeof StockWastageRequestSchema>;
