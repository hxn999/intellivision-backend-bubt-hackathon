import { Router } from "express";
import {
  addFoodLog,
  createGoal,
  deleteFoodLog,
  deleteGoal,
  getGoals,
  setCurrentGoal,
  updateGoal,
  updateHealthProfile,
  updateProfile,
  getUser,
} from "../controllers/userController";
import { authMiddleware } from "../middleware/auth";
import { validateBody } from "../middleware/validate";
import {
  addFoodLogSchema,
  createGoalSchema,
  setCurrentGoalSchema,
  updateGoalSchema,
  updateHealthProfileSchema,
  updateProfileSchema,
} from "../validation/userSchemas";

const router = Router();

// All user routes are protected
router.use(authMiddleware);

// GET /user/me
router.get("/me", getUser);

// PUT /user/health-profile
router.put(
  "/health-profile",
  validateBody(updateHealthProfileSchema),
  updateHealthProfile
);

// PATCH /user/profile
router.patch("/profile", validateBody(updateProfileSchema), updateProfile);

// POST /user/food-logs
router.post("/food-logs", validateBody(addFoodLogSchema), addFoodLog);

// DELETE /user/food-logs/:index
router.delete("/food-logs/:index", deleteFoodLog);

// Goals CRUD
// GET /user/goals
router.get("/goals", getGoals);

// POST /user/goals
router.post("/goals", validateBody(createGoalSchema), createGoal);

// PATCH /user/goals/:index
router.patch("/goals/:index", validateBody(updateGoalSchema), updateGoal);

// DELETE /user/goals/:index
router.delete("/goals/:index", deleteGoal);

// PATCH /user/goals/current
router.patch(
  "/goals/current",
  validateBody(setCurrentGoalSchema),
  setCurrentGoal
);

export default router;
