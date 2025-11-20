import { Schema, Types } from "mongoose";

export interface IFoodLogEntry {
  date: Date;
  time: string;
  foodItem: Types.ObjectId;
  quantity: number;
}

export const FoodLogEntrySchema = new Schema<IFoodLogEntry>(
  {
    date: { type: Date, required: true },
    time: { type: String, required: true },
    foodItem: {
      type: Schema.Types.ObjectId,
      ref: "FoodItem",
      required: true,
    },
    quantity: { type: Number, required: true },
  },
  { _id: false }
);
