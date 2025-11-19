import { Router } from "express";
import {
  createFoodItem,
  deleteFoodItem,
  getFoodItem,
  listFoodItems,
  updateFoodItem,
} from "../controllers/foodItemController";
import { authMiddleware } from "../middleware/auth";
import { validateBody } from "../middleware/validate";
import {
  createFoodItemSchema,
  updateFoodItemSchema,
} from "../validation/foodSchemas";

const router = Router();

router.use(authMiddleware);

// GET /food-items
router.get("/", listFoodItems);

// GET /food-items/:id
router.get("/:id", getFoodItem);

// POST /food-items
router.post("/", validateBody(createFoodItemSchema), createFoodItem);

// PATCH /food-items/:id
router.patch("/:id", validateBody(updateFoodItemSchema), updateFoodItem);

// DELETE /food-items/:id
router.delete("/:id", deleteFoodItem);

export default router;
