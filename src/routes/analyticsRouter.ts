import { Router } from "express";
import { authMiddleware } from "../middleware/auth";
import { validateBody } from "../middleware/validate";
import {
  singleDayAnalyticsSchema,
  monthlyFoodLogsSchema,
  weeklyFoodLogsSchema,
} from "../validation/analyticsSchemas";
import {
  getSingleDayAnalytics,
  getMonthlyFoodLogs,
  getWeeklyFoodLogs,
  getSdgImpactReport,
} from "../controllers/analyticsController";

const router = Router();

router.use(authMiddleware);

// GET /analytics/single-day - Get analytics for a single day
router.get(
  "/single-day",
  validateBody(singleDayAnalyticsSchema),
  getSingleDayAnalytics
);

// POST /analytics/monthly - Get food logs for entire month, separated by day
router.post(
  "/monthly",
  validateBody(monthlyFoodLogsSchema),
  getMonthlyFoodLogs
);

// POST /analytics/weekly - Get food logs for 7 days, separated by day
router.post("/weekly", validateBody(weeklyFoodLogsSchema), getWeeklyFoodLogs);

// POST /analytics/sdg-impact - Get SDG impact score and summary for the week
router.post(
  "/sdg-impact",
  validateBody(weeklyFoodLogsSchema),
  getSdgImpactReport
);

export default router;
