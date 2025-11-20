import { Router } from "express";
import {
  createFoodItem,
  deleteFoodItem,
  getFoodItem,
  listFoodItems,
  updateFoodItem,
  uploadFoodItemImage,
} from "../controllers/foodItemController";
import { authMiddleware } from "../middleware/auth";
import { validateBody } from "../middleware/validate";
import {
  createFoodItemSchema,
  updateFoodItemSchema,
} from "../validation/foodSchemas";
import { upload } from "../middleware/upload";

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

// PATCH /food-items/:id/image - upload food item image
router.patch("/:id/image", upload.single("image"), uploadFoodItemImage);

// DELETE /food-items/:id
router.delete("/:id", deleteFoodItem);

export default router;
