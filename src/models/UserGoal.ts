import { Schema } from "mongoose";

const PRIMARY_GOAL_VALUES = [
  "weight_loss",
  "muscle_gain",
  "maintenance",
  "recomposition",
  "improve_endurance",
  "improve_health",
] as const;

const SECONDARY_GOAL_VALUES = [
  "better_sleep",
  "more_energy",
  "improve_mood",
  "improve_markers",
  "build_habits",
] as const;

const ACTIVITY_LEVEL_VALUES = [
  "sedentary",
  "lightly_active",
  "moderately_active",
  "very_active",
  "extra_active",
] as const;

export type PrimaryGoal = (typeof PRIMARY_GOAL_VALUES)[number];
export type SecondaryGoal = (typeof SECONDARY_GOAL_VALUES)[number];
export type ActivityLevel = (typeof ACTIVITY_LEVEL_VALUES)[number];

export interface IUserGoal {
  primary_goals: PrimaryGoal[];
  secondary_goals: SecondaryGoal[];
  allergies: string[];
  activity_level: ActivityLevel;
  target_weight_kg: number;
  current_weight_kg: number;

  // Daily / per-period nutrition targets (same structure as FoodItem macros/micros)
  calories: number;
  protein: number;
  carbohydrate: number;
  fat_total: number;

  fiber: number;
  sodium: number;
  cholesterol: number;
  potassium: number;

  vitamin_a: number;
  vitamin_c: number;
  vitamin_d: number;
  calcium: number;
  iron: number;
  magnesium: number;
 
}

export const GoalSchema = new Schema<IUserGoal>(
  {
    primary_goals: [
      {
        type: String,
        enum: PRIMARY_GOAL_VALUES,
        required: true,
      },
    ],
    secondary_goals: [
      {
        type: String,
        enum: SECONDARY_GOAL_VALUES,
      },
    ],
    allergies: {
      type: [String],
      default: [],
    },
    activity_level: {
      type: String,
      enum: ACTIVITY_LEVEL_VALUES,
      required: true,
    },
    target_weight_kg: {
      type: Number,
      required: true,
    },
    current_weight_kg: {
      type: Number,
      required: true,
    },

    calories: {
      type: Number,
      required: true,
    },
    protein: {
      type: Number,
      required: true,
    },
    carbohydrate: {
      type: Number,
      required: true,
    },
    fat_total: {
      type: Number,
      required: true,
    },

    fiber: {
      type: Number,
      required: true,
    },
    sodium: {
      type: Number,
      required: true,
    },
    cholesterol: {
      type: Number,
      required: true,
    },
    potassium: {
      type: Number,
      required: true,
    },

    vitamin_a: {
      type: Number,
      required: true,
    },
    vitamin_c: {
      type: Number,
      required: true,
    },
    vitamin_d: {
      type: Number,
      required: true,
    },
    calcium: {
      type: Number,
      required: true,
    },
    iron: {
      type: Number,
      required: true,
    },
    magnesium: {
      type: Number,
      required: true,
    },
   
  },
  { _id: false }
);
