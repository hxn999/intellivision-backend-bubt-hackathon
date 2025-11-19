import { Request, Response } from "express";
import { FoodInventory } from "../models/FoodInventory";
import { FoodItem } from "../models/FoodItem";
import { User } from "../models/User";
import {
  AddInventoryItemInput,
  CreateInventoryInput,
  UpdateInventoryInput,
} from "../validation/foodSchemas";

export const listInventories = async (req: Request, res: Response) => {
  try {
    const userId = req.userId;
    if (!userId) {
      return res.status(401).json({ message: "Unauthorized" });
    }

    const inventories = await FoodInventory.find({ user: userId }).populate(
      "foodItems"
    );
    return res.status(200).json({ inventories });
  } catch (error) {
    // eslint-disable-next-line no-console
    console.error(error);
    return res.status(500).json({ message: "Internal server error" });
  }
};

export const getInventory = async (req: Request, res: Response) => {
  try {
    const userId = req.userId;
    if (!userId) {
      return res.status(401).json({ message: "Unauthorized" });
    }

    const { id } = req.params;
    const inventory = await FoodInventory.findOne({
      _id: id,
      user: userId,
    }).populate("foodItems");

    if (!inventory) {
      return res.status(404).json({ message: "Inventory not found" });
    }

    return res.status(200).json({ inventory });
  } catch (error) {
    // eslint-disable-next-line no-console
    console.error(error);
    return res.status(500).json({ message: "Internal server error" });
  }
};

export const createInventory = async (req: Request, res: Response) => {
  try {
    const userId = req.userId;
    if (!userId) {
      return res.status(401).json({ message: "Unauthorized" });
    }

    const body = req.body as CreateInventoryInput;

    const inventory = await FoodInventory.create({
      name: body.name,
      user: userId,
    });

    await User.findByIdAndUpdate(userId, {
      $addToSet: { inventories: inventory._id },
    });

    return res.status(201).json({ inventory });
  } catch (error) {
    // eslint-disable-next-line no-console
    console.error(error);
    return res.status(500).json({ message: "Internal server error" });
  }
};

export const updateInventory = async (req: Request, res: Response) => {
  try {
    const userId = req.userId;
    if (!userId) {
      return res.status(401).json({ message: "Unauthorized" });
    }

    const { id } = req.params;
    const body = req.body as UpdateInventoryInput;

    const inventory = await FoodInventory.findOne({
      _id: id,
      user: userId,
    });

    if (!inventory) {
      return res.status(404).json({ message: "Inventory not found" });
    }

    if (body.name) {
      inventory.name = body.name;
    }

    await inventory.save();

    return res.status(200).json({ inventory });
  } catch (error) {
    // eslint-disable-next-line no-console
    console.error(error);
    return res.status(500).json({ message: "Internal server error" });
  }
};

export const deleteInventory = async (req: Request, res: Response) => {
  try {
    const userId = req.userId;
    if (!userId) {
      return res.status(401).json({ message: "Unauthorized" });
    }

    const { id } = req.params;

    const inventory = await FoodInventory.findOneAndDelete({
      _id: id,
      user: userId,
    });

    if (!inventory) {
      return res.status(404).json({ message: "Inventory not found" });
    }

    await User.findByIdAndUpdate(userId, {
      $pull: { inventories: inventory._id },
    });

    return res.status(200).json({ deleted: inventory });
  } catch (error) {
    // eslint-disable-next-line no-console
    console.error(error);
    return res.status(500).json({ message: "Internal server error" });
  }
};

export const addItemToInventory = async (req: Request, res: Response) => {
  try {
    const userId = req.userId;
    if (!userId) {
      return res.status(401).json({ message: "Unauthorized" });
    }

    const { id } = req.params;
    const body = req.body as AddInventoryItemInput;

    const inventory = await FoodInventory.findOne({
      _id: id,
      user: userId,
    });

    if (!inventory) {
      return res.status(404).json({ message: "Inventory not found" });
    }

    const foodItem = await FoodItem.findOne({
      _id: body.foodItemId,
      created_by: userId,
    });

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

export const removeItemFromInventory = async (req: Request, res: Response) => {
  try {
    const userId = req.userId;
    if (!userId) {
      return res.status(401).json({ message: "Unauthorized" });
    }

    const { id, foodItemId } = req.params;

    const inventory = await FoodInventory.findOne({
      _id: id,
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
