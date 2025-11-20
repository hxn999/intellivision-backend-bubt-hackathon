import { Router } from "express";
import { authMiddleware } from "../middleware/auth";
import { validateBody } from "../middleware/validate";
import { singleDayAnalyticsSchema } from "../validation/analyticsSchemas";
import { getSingleDayAnalytics } from "../controllers/analyticsController";

const router = Router();

router.use(authMiddleware);

router.get(
  "/single-day",
  validateBody(singleDayAnalyticsSchema),
  getSingleDayAnalytics
);

export default router;
