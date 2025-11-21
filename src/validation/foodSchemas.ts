import { z } from "zod";

export const createFoodItemSchema = z.object({
  // Basic info
  name: z.string().min(1),
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

  expiration_hours: z.number().positive(),

  price_per_unit_bdt: z.number().positive().optional(),

  image_url: z.string().url().optional(),

  tags: z.array(z.string()).optional().default([]),
  allergens: z.array(z.string()).optional().default([]),
  source: z.string().optional().default("User_Submission"),

  // Optional: add to user's inventory immediately after creation
  addToInventory: z.boolean().optional().default(false),
});

export type CreateFoodItemInput = z.infer<typeof createFoodItemSchema>;

export const updateFoodItemSchema = createFoodItemSchema.partial();

export type UpdateFoodItemInput = z.infer<typeof updateFoodItemSchema>;

export const updateInventorySchema = z.object({
  name: z.string().min(1).optional(),
});

export type UpdateInventoryInput = z.infer<typeof updateInventorySchema>;

export const addInventoryItemSchema = z.object({
  foodItemId: z.string().min(1),
});

export type AddInventoryItemInput = z.infer<typeof addInventoryItemSchema>;
