import { z } from "zod";

export const singleDayAnalyticsSchema = z.object({
  date: z.coerce.date(),
});

export type SingleDayAnalyticsInput = z.infer<typeof singleDayAnalyticsSchema>;
