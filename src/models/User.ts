import mongoose, { Document, Schema, Types } from "mongoose";

export interface IUserHealthProfile {
  // Metabolic baseline
  birth_date: Date;
  gender: "male" | "female";
  height_cm: number;
  current_weight_kg: number;

  // Body composition
  body_fat_percentage?: number;
  waist_circumference_cm?: number;
  hip_circumference_cm?: number;
  neck_circumference_cm?: number;

  // Activity & lifestyle
  activity_level_factor?: number;
  steps_daily_average?: number;
  sleep_hours_average?: number;

  // Biomarkers
  blood_glucose_fasting?: number;
  hba1c?: number;
  blood_pressure_systolic?: number;
  blood_pressure_diastolic?: number;
  cholesterol_ldl?: number;
  cholesterol_hdl?: number;
}

export interface IFoodLogEntry {
  date: Date;
  time: string;
  foodItem: Types.ObjectId;
  quantity: number;
}

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
}

export interface IUser extends Document {
  fullName: string;
  email: string;
  password: string;
  inventories: Types.ObjectId[];
  healthProfile?: IUserHealthProfile;
  foodLogs?: IFoodLogEntry[];
  goals?: IUserGoal[];
  current_goal_index?: number;
}

const HealthProfileSchema = new Schema<IUserHealthProfile>(
  {
    birth_date: { type: Date, required: true },
    gender: {
      type: String,
      enum: ["male", "female"],
      required: true,
    },
    height_cm: { type: Number, required: true },
    current_weight_kg: { type: Number, required: true },

    body_fat_percentage: { type: Number },
    waist_circumference_cm: { type: Number },
    hip_circumference_cm: { type: Number },
    neck_circumference_cm: { type: Number },

    activity_level_factor: { type: Number },
    steps_daily_average: { type: Number },
    sleep_hours_average: { type: Number },

    blood_glucose_fasting: { type: Number },
    hba1c: { type: Number },
    blood_pressure_systolic: { type: Number },
    blood_pressure_diastolic: { type: Number },
    cholesterol_ldl: { type: Number },
    cholesterol_hdl: { type: Number },
  },
  { _id: false }
);

const FoodLogEntrySchema = new Schema<IFoodLogEntry>(
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

const GoalSchema = new Schema<IUserGoal>(
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
  },
  { _id: false }
);

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
    inventories: [
      {
        type: Schema.Types.ObjectId,
        ref: "FoodInventory",
      },
    ],
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
  },
  {
    timestamps: true,
  }
);

export const User = mongoose.model<IUser>("User", UserSchema);
