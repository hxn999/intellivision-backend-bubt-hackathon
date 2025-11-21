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

export interface IMealPlanItem {
  quantity: number;
  foodItem: Types.ObjectId;
}

export interface IChatMessage {
  role: "user" | "assistant";
  content: string;
  timestamp: Date;
}

export interface IChatSession {
  _id: string;
  title: string;
  systemInstruction?: string;
  messages: IChatMessage[];
  createdAt: Date;
  updatedAt: Date;
}

export interface IAIGeneratedMealPlan {
  meals: Array<{
    name: string;
    items: Array<{
      foodItemId: string;
      foodItemName: string;
      quantity: number;
      servingUnit: string;
    }>;
    totals: {
      calories: number;
      protein: number;
      carbohydrate: number;
      fat_total: number;
      fiber: number;
    };
  }>;
  dailyTotals: {
    calories: number;
    protein: number;
    carbohydrate: number;
    fat_total: number;
    fiber: number;
  };
  goalComparison: {
    caloriesDiff: number;
    proteinDiff: number;
    carbsDiff: number;
    fatDiff: number;
    fiberDiff: number;
  };
  generatedAt: Date;
  preferences?: string;
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
  meal_plan?: IMealPlanItem[];
  chatSessions?: IChatSession[];
  ai_meal_plan?: IAIGeneratedMealPlan;
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
    meal_plan: {
      type: [
        {
          quantity: { type: Number, required: true },
          foodItem: {
            type: Schema.Types.ObjectId,
            ref: "FoodItem",
            required: true,
          },
        },
      ],
      default: [],
    },
    chatSessions: {
      type: [
        {
          _id: { type: String, required: true },
          title: { type: String, required: true },
          systemInstruction: { type: String },
          messages: [
            {
              role: {
                type: String,
                enum: ["user", "assistant"],
                required: true,
              },
              content: { type: String, required: true },
              timestamp: { type: Date, default: Date.now },
            },
          ],
          createdAt: { type: Date, default: Date.now },
          updatedAt: { type: Date, default: Date.now },
        },
      ],
      default: [],
    },
    ai_meal_plan: {
      type: {
        meals: [
          {
            name: { type: String, required: true },
            items: [
              {
                foodItemId: { type: String, required: true },
                foodItemName: { type: String, required: true },
                quantity: { type: Number, required: true },
                servingUnit: { type: String, required: true },
              },
            ],
            totals: {
              calories: { type: Number, required: true },
              protein: { type: Number, required: true },
              carbohydrate: { type: Number, required: true },
              fat_total: { type: Number, required: true },
              fiber: { type: Number, required: true },
            },
          },
        ],
        dailyTotals: {
          calories: { type: Number, required: true },
          protein: { type: Number, required: true },
          carbohydrate: { type: Number, required: true },
          fat_total: { type: Number, required: true },
          fiber: { type: Number, required: true },
        },
        goalComparison: {
          caloriesDiff: { type: Number, required: true },
          proteinDiff: { type: Number, required: true },
          carbsDiff: { type: Number, required: true },
          fatDiff: { type: Number, required: true },
          fiberDiff: { type: Number, required: true },
        },
        generatedAt: { type: Date, default: Date.now },
        preferences: { type: String },
      },
      required: false,
    },
  },
  {
    timestamps: true,
  }
);

export const User = mongoose.model<IUser>("User", UserSchema);
