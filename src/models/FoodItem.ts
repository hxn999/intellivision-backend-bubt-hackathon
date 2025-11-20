import mongoose, { Document, Schema } from "mongoose";

export interface IFoodItem extends Document {
  // Basic info
  name: string;
  slug: string;
  description?: string;

  // Measurement & serving logic
  serving_quantity: number;
  serving_unit: string;
  serving_weight_grams: number;
  metric_serving_amount: number;
  metric_serving_unit: string;

  // Nutritional data (normalized, usually per 100g / 100ml)
  calories: number;
  protein: number;
  carbohydrate: number;
  fat_total: number;

  fiber?: number;
  sugar_total?: number;
  sugar_added?: number;
  fat_saturated?: number;
  fat_trans?: number;
  sodium?: number;
  cholesterol?: number;
  potassium?: number;

  vitamin_a?: number;
  vitamin_c?: number;
  vitamin_d?: number;
  calcium?: number;
  iron?: number;
  magnesium?: number;
  zinc?: number;

  // Expiration info
  expiration_hours: number;

  // Pricing
  price_per_unit_bdt?: number;

  // Image
  image_url?: string;

  // Metadata & classification
  tags: string[];
  allergens: string[];
  source: string;
  created_by: mongoose.Types.ObjectId;
}

const FoodItemSchema: Schema<IFoodItem> = new Schema(
  {
    name: { type: String, required: true, trim: true },
    description: { type: String, trim: true },

    serving_quantity: { type: Number, required: true, default: 1 },
    serving_unit: { type: String, required: true },
    serving_weight_grams: { type: Number, required: true },

    metric_serving_amount: { type: Number, required: true, default: 100 },
    metric_serving_unit: { type: String, required: true, default: "g" }, // or "ml"

    calories: { type: Number, required: true },
    protein: { type: Number, required: true },
    carbohydrate: { type: Number, required: true },
    fat_total: { type: Number, required: true },

    fiber: { type: Number },
    sugar_total: { type: Number },
    sugar_added: { type: Number },
    fat_saturated: { type: Number },
    fat_trans: { type: Number },
    sodium: { type: Number },
    cholesterol: { type: Number },
    potassium: { type: Number },

    vitamin_a: { type: Number },
    vitamin_c: { type: Number },
    vitamin_d: { type: Number },
    calcium: { type: Number },
    iron: { type: Number },
    magnesium: { type: Number },
    zinc: { type: Number },

    expiration_hours: { type: Number, required: true },

    price_per_unit_bdt: { type: Number },

    image_url: { type: String },

    tags: { type: [String], default: [] },
    allergens: { type: [String], default: [] },

    source: { type: String, required: true, default: "Seed" },
  },
  {
    timestamps: true,
  }
);

export const FoodItem = mongoose.model<IFoodItem>("FoodItem", FoodItemSchema);
