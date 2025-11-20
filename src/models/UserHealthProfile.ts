import { Schema } from "mongoose";

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
  activity_level_factor: number;
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

export const HealthProfileSchema = new Schema<IUserHealthProfile>(
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

    activity_level_factor: { type: Number,required:true },
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
