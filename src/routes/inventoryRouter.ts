import { Router } from "express";
import {
  addItemToInventory,
  createInventory,
  deleteInventory,
  getInventory,
  listInventories,
  removeItemFromInventory,
  updateInventory,
} from "../controllers/inventoryController";
import { authMiddleware } from "../middleware/auth";
import { validateBody } from "../middleware/validate";
import {
  addInventoryItemSchema,
  createInventorySchema,
  updateInventorySchema,
} from "../validation/foodSchemas";

const router = Router();

router.use(authMiddleware);

// GET /inventories
router.get("/", listInventories);

// GET /inventories/:id
router.get("/:id", getInventory);

// POST /inventories
router.post("/", validateBody(createInventorySchema), createInventory);

// PATCH /inventories/:id
router.patch("/:id", validateBody(updateInventorySchema), updateInventory);

// DELETE /inventories/:id
router.delete("/:id", deleteInventory);

// POST /inventories/:id/items
router.post(
  "/:id/items",
  validateBody(addInventoryItemSchema),
  addItemToInventory
);

// DELETE /inventories/:id/items/:foodItemId
router.delete("/:id/items/:foodItemId", removeItemFromInventory);

export default router;
