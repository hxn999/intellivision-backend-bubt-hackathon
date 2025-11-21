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
  uploadProfileImage,
  getUser,
  uploadAIInventoryLog,
  uploadAIFoodLog,
  getAIInventoryLogs,
  getAIFoodLogs,
  getMealPlan,
  addMealPlanItem,
  deleteMealPlanItem,
  getChatSessions,
  createChatSession,
  getChatSession,
  sendChatMessage,
  deleteChatSession,
} from "../controllers/userController";
import { authMiddleware } from "../middleware/auth";
import { validateBody } from "../middleware/validate";
import {
  addFoodLogSchema,
  addMealPlanItemSchema,
  createChatSessionSchema,
  createGoalSchema,
  sendChatMessageSchema,
  setCurrentGoalSchema,
  updateGoalSchema,
  updateHealthProfileSchema,
  updateProfileSchema,
} from "../validation/userSchemas";
import { upload } from "../middleware/upload";

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

// PATCH /user/profile-image - upload profile image
router.patch("/profile-image", upload.single("image"), uploadProfileImage);

// AI Image Logs
// GET /user/ai-inventory-logs - get all AI inventory logs
router.get("/ai-inventory-logs", getAIInventoryLogs);

// POST /user/ai-inventory-log - upload AI generated inventory log image
router.post("/ai-inventory-log", upload.single("image"), uploadAIInventoryLog);

// GET /user/ai-food-logs - get all AI food logs
router.get("/ai-food-logs", getAIFoodLogs);

// POST /user/ai-food-log - upload AI generated food log image
router.post("/ai-food-log", upload.single("image"), uploadAIFoodLog);

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

// Meal Plan
// GET /user/meal-plan
router.get("/meal-plan", getMealPlan);

// POST /user/meal-plan
router.post("/meal-plan", validateBody(addMealPlanItemSchema), addMealPlanItem);

// DELETE /user/meal-plan/:index
router.delete("/meal-plan/:index", deleteMealPlanItem);

// Chat Sessions
// GET /user/chat-sessions - Get all chat sessions
router.get("/chat-sessions", getChatSessions);

// POST /user/chat-sessions - Create new chat session
router.post(
  "/chat-sessions",
  validateBody(createChatSessionSchema),
  createChatSession
);

// GET /user/chat-sessions/:sessionId - Get specific chat session
router.get("/chat-sessions/:sessionId", getChatSession);

// POST /user/chat-sessions/:sessionId/message - Send message in session
router.post(
  "/chat-sessions/:sessionId/message",
  validateBody(sendChatMessageSchema),
  sendChatMessage
);

// DELETE /user/chat-sessions/:sessionId - Delete chat session
router.delete("/chat-sessions/:sessionId", deleteChatSession);

export default router;
