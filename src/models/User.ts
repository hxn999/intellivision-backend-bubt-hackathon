import mongoose, { Document, Schema, Types } from "mongoose";
import { IUserHealthProfile, HealthProfileSchema } from "./UserHealthProfile";
import { IFoodLogEntry, FoodLogEntrySchema } from "./FoodLogEntry";
import {
  IUserGoal,
  GoalSchema,
  PrimaryGoal,
  SecondaryGoal,
  ActivityLevel,
} from "./UserGoal";

// Re-export for backward compatibility
export type {
  IUserHealthProfile,
  IFoodLogEntry,
  IUserGoal,
  PrimaryGoal,
  SecondaryGoal,
  ActivityLevel,
};

export interface IAIImageLog {
  _id: string;
  url: string;
}

export interface IUser extends Document {
  fullName: string;
  email: string;
  password: string;
  image_url: string;
  inventory?: Types.ObjectId;
  healthProfile?: IUserHealthProfile;
  foodLogs?: IFoodLogEntry[];
  goals?: IUserGoal[];
  current_goal_index?: number;
  ai_generated_inventory_logs?: IAIImageLog[];
  ai_generated_food_logs?: IAIImageLog[];
}

const UserSchema: Schema<IUser> = new Schema(
  {
    fullName: {
      type: String,
      required: true,
      trim: true,
    },
    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
    },
    password: {
      type: String,
      required: true,
    },
    image_url: {
      type: String,
      required: true,
      default: "https://api.dicebear.com/7.x/avataaars/svg?seed=default",
    },
    inventory: {
      type: Schema.Types.ObjectId,
      ref: "FoodInventory",
    },
    healthProfile: {
      type: HealthProfileSchema,
      required: false,
    },
    foodLogs: {
      type: [FoodLogEntrySchema],
      required: false,
      default: [],
    },
    goals: {
      type: [GoalSchema],
      required: false,
      default: [],
    },
    current_goal_index: {
      type: Number,
      required: false,
    },
    ai_generated_inventory_logs: {
      type: [
        {
          _id: { type: String, required: true },
          url: { type: String, required: true },
        },
      ],
      default: [],
    },
    ai_generated_food_logs: {
      type: [
        {
          _id: { type: String, required: true },
          url: { type: String, required: true },
        },
      ],
      default: [],
    },
  },
  {
    timestamps: true,
  }
);

export const User = mongoose.model<IUser>("User", UserSchema);
