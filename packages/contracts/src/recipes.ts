import { z } from 'zod';
import { UnitCodeSchema } from './inventory.js';

export const PreparationPolicySchema = z.enum([
  'READY_BATCH',
  'FRESH_ORDER',
  'FINISH_ON_DEMAND'
]);
export type PreparationPolicy = z.infer<typeof PreparationPolicySchema>;

export const RecipeIngredientSchema = z.object({
  ingredientId: z.string().min(1),
  quantity: z.number().positive(),
  unit: UnitCodeSchema,
  wasteFactorPct: z.number().min(0).max(100).default(0),
  isSubRecipe: z.boolean().default(false),
  subRecipeId: z.string().min(1).optional()
});
export type RecipeIngredient = z.infer<typeof RecipeIngredientSchema>;

export const RecipeStepSchema = z.object({
  id: z.string().min(1),
  stepOrder: z.number().int().positive(),
  titleEn: z.string(),
  titleKn: z.string(),
  instructionEn: z.string(),
  instructionKn: z.string(),
  durationSeconds: z.number().int().positive(),
  equipmentTypeNeeded: z.enum(['GAS_STOVE', 'TAWA', 'PREP_TABLE', 'VESSEL', 'WARMER']).optional(),
  imageUrl: z.string().optional()
});
export type RecipeStep = z.infer<typeof RecipeStepSchema>;

export const RecipeVersionSchema = z.object({
  id: z.string().min(1),
  recipeId: z.string().min(1),
  versionNumber: z.number().int().positive(),
  status: z.enum(['DRAFT', 'UNDER_REVIEW', 'APPROVED', 'ARCHIVED']),
  baseYieldQuantity: z.number().positive(),
  yieldUnit: UnitCodeSchema,
  preparationPolicy: PreparationPolicySchema,
  ingredients: z.array(RecipeIngredientSchema),
  steps: z.array(RecipeStepSchema),
  approvedAt: z.string().datetime().optional()
});
export type RecipeVersion = z.infer<typeof RecipeVersionSchema>;

export const DishVariantSchema = z.object({
  id: z.string().min(1),
  nameEn: z.string(),
  nameKn: z.string(),
  portionQuantity: z.number().positive(),
  portionUnit: UnitCodeSchema,
  pricePaise: z.number().int().positive(),
  packagingItemId: z.string().min(1).optional()
});
export type DishVariant = z.infer<typeof DishVariantSchema>;

export const DishSchema = z.object({
  id: z.string().min(1),
  code: z.string(),
  nameEn: z.string(),
  nameKn: z.string(),
  descriptionEn: z.string(),
  descriptionKn: z.string(),
  preparationPolicy: PreparationPolicySchema,
  recipeId: z.string().min(1),
  activeVersionId: z.string().min(1),
  variants: z.array(DishVariantSchema),
  imageUrl: z.string(),
  isActive: z.boolean(),
  allergens: z.array(z.string()).default([])
});
export type Dish = z.infer<typeof DishSchema>;
