import { pgTable, text, timestamp, uuid, integer, numeric, boolean } from 'drizzle-orm/pg-core';
import { branches } from './organizations.js';
import { ingredients } from './inventory.js';

export const recipes = pgTable('recipes', {
  id: uuid('id').defaultRandom().primaryKey(),
  branchId: uuid('branch_id').references(() => branches.id).notNull(),
  code: text('code').notNull(),
  nameEn: text('name_en').notNull(),
  nameKn: text('name_kn').notNull(),
  descriptionEn: text('description_en'),
  descriptionKn: text('description_kn'),
  preparationPolicy: text('preparation_policy').notNull(),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull()
});

export const recipeVersions = pgTable('recipe_versions', {
  id: uuid('id').defaultRandom().primaryKey(),
  recipeId: uuid('recipe_id').references(() => recipes.id).notNull(),
  versionNumber: integer('version_number').notNull(),
  status: text('status').default('DRAFT').notNull(),
  baseYieldQuantity: numeric('base_yield_quantity', { precision: 12, scale: 3 }).notNull(),
  yieldUnit: text('yield_unit').notNull(),
  approvedAt: timestamp('approved_at', { withTimezone: true }),
  approvedByUserId: uuid('approved_by_user_id'),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull()
});

export const recipeIngredients = pgTable('recipe_ingredients', {
  id: uuid('id').defaultRandom().primaryKey(),
  recipeVersionId: uuid('recipe_version_id').references(() => recipeVersions.id).notNull(),
  ingredientId: uuid('ingredient_id').references(() => ingredients.id).notNull(),
  quantity: numeric('quantity', { precision: 12, scale: 3 }).notNull(),
  unit: text('unit').notNull(),
  wasteFactorPct: numeric('waste_factor_pct', { precision: 5, scale: 2 }).default('0').notNull(),
  isSubRecipe: boolean('is_sub_recipe').default(false).notNull(),
  subRecipeId: uuid('sub_recipe_id')
});

export const recipeSteps = pgTable('recipe_steps', {
  id: uuid('id').defaultRandom().primaryKey(),
  recipeVersionId: uuid('recipe_version_id').references(() => recipeVersions.id).notNull(),
  stepOrder: integer('step_order').notNull(),
  titleEn: text('title_en').notNull(),
  titleKn: text('title_kn').notNull(),
  instructionEn: text('instruction_en').notNull(),
  instructionKn: text('instruction_kn').notNull(),
  durationSeconds: integer('duration_seconds').notNull(),
  equipmentTypeNeeded: text('equipment_type_needed'),
  imageUrl: text('image_url')
});

export const dishes = pgTable('dishes', {
  id: uuid('id').defaultRandom().primaryKey(),
  branchId: uuid('branch_id').references(() => branches.id).notNull(),
  recipeId: uuid('recipe_id').references(() => recipes.id).notNull(),
  activeVersionId: uuid('active_version_id').references(() => recipeVersions.id).notNull(),
  code: text('code').notNull(),
  nameEn: text('name_en').notNull(),
  nameKn: text('name_kn').notNull(),
  descriptionEn: text('description_en'),
  descriptionKn: text('description_kn'),
  preparationPolicy: text('preparation_policy').notNull(),
  imageUrl: text('image_url').notNull(),
  isActive: boolean('is_active').default(true).notNull(),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull()
});

export const dishVariants = pgTable('dish_variants', {
  id: uuid('id').defaultRandom().primaryKey(),
  dishId: uuid('dish_id').references(() => dishes.id).notNull(),
  nameEn: text('name_en').notNull(),
  nameKn: text('name_kn').notNull(),
  portionQuantity: numeric('portion_quantity', { precision: 12, scale: 3 }).notNull(),
  portionUnit: text('portion_unit').notNull(),
  pricePaise: integer('price_paise').notNull(),
  packagingItemId: uuid('packaging_item_id').references(() => ingredients.id)
});
