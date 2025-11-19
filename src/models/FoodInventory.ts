import mongoose, { Document, Schema } from "mongoose";

export interface IFoodInventory extends Document {
  name: string;
  user: mongoose.Types.ObjectId;
  foodItems: mongoose.Types.ObjectId[];
}

const FoodInventorySchema: Schema<IFoodInventory> = new Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
    },
    user: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    foodItems: [
      {
        type: Schema.Types.ObjectId,
        ref: "FoodItem",
      },
    ],
  },
  {
    timestamps: true,
  }
);

export const FoodInventory = mongoose.model<IFoodInventory>(
  "FoodInventory",
  FoodInventorySchema
);
