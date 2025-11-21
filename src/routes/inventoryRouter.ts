import { Router } from "express";
import {
  addItemToInventory,
  getInventory,
  removeItemFromInventory,
  updateInventory,
} from "../controllers/inventoryController";
import { checkInventoryExpiration } from "../controllers/inventoryExpirationController";
import { authMiddleware } from "../middleware/auth";
import { validateBody } from "../middleware/validate";
import {
  addInventoryItemSchema,
  updateInventorySchema,
} from "../validation/foodSchemas";

const router = Router();

router.use(authMiddleware);

// GET /inventories - Get user's inventory
router.get("/", getInventory);

// PATCH /inventory - Update inventory name
router.patch("/", validateBody(updateInventorySchema), updateInventory);

// POST /inventory/items - Add item to inventory
router.post("/items", validateBody(addInventoryItemSchema), addItemToInventory);

// DELETE /inventory/items/:foodItemId - Remove item from inventory
router.delete("/items/:foodItemId", removeItemFromInventory);

// GET /inventory/expiration-check - Check food expiration status
router.get("/expiration-check", checkInventoryExpiration);

export default router;
