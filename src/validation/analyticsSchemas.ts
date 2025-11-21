import { z } from "zod";

export const singleDayAnalyticsSchema = z.object({
  date: z.coerce.date(),
});

export type SingleDayAnalyticsInput = z.infer<typeof singleDayAnalyticsSchema>;

export const monthlyFoodLogsSchema = z.object({
  year: z.number().int().min(2000).max(2100),
  month: z.number().int().min(1).max(12),
});

export type MonthlyFoodLogsInput = z.infer<typeof monthlyFoodLogsSchema>;

export const weeklyFoodLogsSchema = z.object({
  startDate: z.coerce.date(),
});

export type WeeklyFoodLogsInput = z.infer<typeof weeklyFoodLogsSchema>;
