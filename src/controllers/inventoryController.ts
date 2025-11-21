import { Request, Response } from "express";
import { FoodInventory } from "../models/FoodInventory";
import { FoodItem } from "../models/FoodItem";
import { User } from "../models/User";
import {
  AddInventoryItemInput,
  UpdateInventoryInput,
} from "../validation/foodSchemas";

// POST /inventory/create - Create inventory with User_Submission food items
export const createInventory = async (req: Request, res: Response) => {
  try {
    const userId = req.userId;
    if (!userId) {
      return res.status(401).json({ message: "Unauthorized" });
    }

    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    // Check if user already has an inventory
    if (user.inventory) {
      const existingInventory = await FoodInventory.findById(
        user.inventory
      ).populate("foodItems");
      return res.status(200).json({
        message: "Inventory already exists",
        inventory: existingInventory,
        alreadyExists: true,
      });
    }

    // Find all food items with source "User_Submission"
    const userSubmissionFoodItems = await FoodItem.find({
      source: "User_Submission",
    });

    // Create new inventory
    const inventory = new FoodInventory({
      name: `${user.fullName}'s Inventory`,
      user: userId,
      foodItems: userSubmissionFoodItems.map((item) => item._id),
    });

    await inventory.save();

    // Update user with inventory reference
    user.inventory = inventory._id;
    await user.save();

    // Populate food items before returning
    const populatedInventory = await inventory.populate("foodItems");

    return res.status(201).json({
      message: "Inventory created successfully",
      inventory: populatedInventory,
      itemsAdded: userSubmissionFoodItems.length,
    });
  } catch (error) {
    // eslint-disable-next-line no-console
    console.error(error);
    return res.status(500).json({ message: "Internal server error" });
  }
};

// GET /inventory - Get user's inventory
export const getInventory = async (req: Request, res: Response) => {
  try {
    const userId = req.userId;
    if (!userId) {
      return res.status(401).json({ message: "Unauthorized" });
    }

    const user = await User.findById(userId).populate({
      path: "inventory",
      populate: {
        path: "foodItems",
      },
    });

    if (!user || !user.inventory) {
      return res.status(404).json({ message: "Inventory not found" });
    }

    return res.status(200).json({ inventory: user.inventory });
  } catch (error) {
    // eslint-disable-next-line no-console
    console.error(error);
    return res.status(500).json({ message: "Internal server error" });
  }
};

// PATCH /inventory - Update inventory name
export const updateInventory = async (req: Request, res: Response) => {
  try {
    const userId = req.userId;
    if (!userId) {
      return res.status(401).json({ message: "Unauthorized" });
    }

    const body = req.body as UpdateInventoryInput;

    const user = await User.findById(userId);
    if (!user || !user.inventory) {
      return res.status(404).json({ message: "Inventory not found" });
    }

    const inventory = await FoodInventory.findOne({
      _id: user.inventory,
      user: userId,
    });

    if (!inventory) {
      return res.status(404).json({ message: "Inventory not found" });
    }

    if (body.name) {
      inventory.name = body.name;
      await inventory.save();
    }

    const populated = await inventory.populate("foodItems");

    return res.status(200).json({ inventory: populated });
  } catch (error) {
    // eslint-disable-next-line no-console
    console.error(error);
    return res.status(500).json({ message: "Internal server error" });
  }
};

// POST /inventory/items - Add item to inventory
export const addItemToInventory = async (req: Request, res: Response) => {
  try {
    const userId = req.userId;
    if (!userId) {
      return res.status(401).json({ message: "Unauthorized" });
    }

    const body = req.body as AddInventoryItemInput;

    const user = await User.findById(userId);
    if (!user || !user.inventory) {
      return res.status(404).json({ message: "Inventory not found" });
    }

    const inventory = await FoodInventory.findOne({
      _id: user.inventory,
      user: userId,
    });

    if (!inventory) {
      return res.status(404).json({ message: "Inventory not found" });
    }

    const foodItem = await FoodItem.findById(body.foodItemId);

    if (!foodItem) {
      return res.status(404).json({ message: "Food item not found" });
    }

    const exists = inventory.foodItems.some(
      (fi) => fi.toString() === body.foodItemId
    );

    if (!exists) {
      inventory.foodItems.push(foodItem._id);
      await inventory.save();
    }

    const populated = await inventory.populate("foodItems");

    return res.status(200).json({ inventory: populated });
  } catch (error) {
    // eslint-disable-next-line no-console
    console.error(error);
    return res.status(500).json({ message: "Internal server error" });
  }
};

// DELETE /inventory/items/:foodItemId - Remove item from inventory
export const removeItemFromInventory = async (req: Request, res: Response) => {
  try {
    const userId = req.userId;
    if (!userId) {
      return res.status(401).json({ message: "Unauthorized" });
    }

    const { foodItemId } = req.params;

    const user = await User.findById(userId);
    if (!user || !user.inventory) {
      return res.status(404).json({ message: "Inventory not found" });
    }

    const inventory = await FoodInventory.findOne({
      _id: user.inventory,
      user: userId,
    });

    if (!inventory) {
      return res.status(404).json({ message: "Inventory not found" });
    }

    const beforeCount = inventory.foodItems.length;
    inventory.foodItems = inventory.foodItems.filter(
      (fi) => fi.toString() !== foodItemId
    );

    if (inventory.foodItems.length === beforeCount) {
      return res.status(404).json({ message: "Food item not in inventory" });
    }

    await inventory.save();

    const populated = await inventory.populate("foodItems");

    return res.status(200).json({ inventory: populated });
  } catch (error) {
    // eslint-disable-next-line no-console
    console.error(error);
    return res.status(500).json({ message: "Internal server error" });
  }
};
