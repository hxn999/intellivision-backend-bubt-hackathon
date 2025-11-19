import { z } from "zod";

export const createFoodItemSchema = z.object({
  // Basic info
  name: z.string().min(1),
  slug: z.string().min(1),
  description: z.string().optional(),

  // Measurement & serving logic
  serving_quantity: z.number().positive(),
  serving_unit: z.string().min(1),
  serving_weight_grams: z.number().positive(),
  metric_serving_amount: z.number().positive().default(100),
  metric_serving_unit: z.string().min(1).default("g"),

  // Nutritional data (normalized, usually per 100g / 100ml)
  calories: z.number(),
  protein: z.number(),
  carbohydrate: z.number(),
  fat_total: z.number(),

  fiber: z.number().optional(),
  sugar_total: z.number().optional(),
  sugar_added: z.number().optional(),
  fat_saturated: z.number().optional(),
  fat_trans: z.number().optional(),
  sodium: z.number().optional(),
  cholesterol: z.number().optional(),
  potassium: z.number().optional(),

  vitamin_a: z.number().optional(),
  vitamin_c: z.number().optional(),
  vitamin_d: z.number().optional(),
  calcium: z.number().optional(),
  iron: z.number().optional(),
  magnesium: z.number().optional(),
  zinc: z.number().optional(),

  tags: z.array(z.string()).optional().default([]),
  allergens: z.array(z.string()).optional().default([]),
  source: z.string().optional().default("User_Submission"),

  // Optional: immediately attach to an inventory owned by the user
  inventoryId: z.string().min(1).optional(),
});

export type CreateFoodItemInput = z.infer<typeof createFoodItemSchema>;

export const updateFoodItemSchema = createFoodItemSchema.partial();

export type UpdateFoodItemInput = z.infer<typeof updateFoodItemSchema>;

export const createInventorySchema = z.object({
  name: z.string().min(1),
});

export type CreateInventoryInput = z.infer<typeof createInventorySchema>;

export const updateInventorySchema = z.object({
  name: z.string().min(1).optional(),
});

export type UpdateInventoryInput = z.infer<typeof updateInventorySchema>;

export const addInventoryItemSchema = z.object({
  foodItemId: z.string().min(1),
});

export type AddInventoryItemInput = z.infer<typeof addInventoryItemSchema>;
