import { Request, Response } from "express";
import { FoodItem } from "../models/FoodItem";
import { FoodInventory } from "../models/FoodInventory";
import { User } from "../models/User";
import {
  CreateFoodItemInput,
  UpdateFoodItemInput,
} from "../validation/foodSchemas";
import cloudinary from "../config/cloudinary";

export const listFoodItems = async (req: Request, res: Response) => {
  try {
    const userId = req.userId;
    if (!userId) {
      return res.status(401).json({ message: "Unauthorized" });
    }

    const items = await FoodItem.find({ created_by: userId });
    return res.status(200).json({ items });
  } catch (error) {
    // eslint-disable-next-line no-console
    console.error(error);
    return res.status(500).json({ message: "Internal server error" });
  }
};

export const getFoodItem = async (req: Request, res: Response) => {
  try {
    const userId = req.userId;
    if (!userId) {
      return res.status(401).json({ message: "Unauthorized" });
    }

    const { id } = req.params;
    const item = await FoodItem.findOne({ _id: id, created_by: userId });
    if (!item) {
      return res.status(404).json({ message: "Food item not found" });
    }

    return res.status(200).json({ item });
  } catch (error) {
    // eslint-disable-next-line no-console
    console.error(error);
    return res.status(500).json({ message: "Internal server error" });
  }
};

export const createFoodItem = async (req: Request, res: Response) => {
  try {
    const userId = req.userId;
    if (!userId) {
      return res.status(401).json({ message: "Unauthorized" });
    }

    const body = req.body as CreateFoodItemInput;

    const { addToInventory, ...itemData } = body;

    const item = await FoodItem.create({
      ...itemData,
    });

    // Optionally add to user's inventory
    if (addToInventory) {
      const user = await User.findById(userId);
      if (user && user.inventory) {
        const inventory = await FoodInventory.findOne({
          _id: user.inventory,
          user: userId,
        });

        if (inventory) {
          const exists = inventory.foodItems.some(
            (fi) => fi.toString() === item._id.toString()
          );
          if (!exists) {
            inventory.foodItems.push(item._id);
            await inventory.save();
          }
        }
      }
    }

    return res.status(201).json({ item });
  } catch (error) {
    // eslint-disable-next-line no-console
    console.error(error);
    return res.status(500).json({ message: "Internal server error" });
  }
};

export const updateFoodItem = async (req: Request, res: Response) => {
  try {
    const userId = req.userId;
    if (!userId) {
      return res.status(401).json({ message: "Unauthorized" });
    }

    const { id } = req.params;
    const body = req.body as UpdateFoodItemInput;

    const item = await FoodItem.findOne({ _id: id, created_by: userId });
    if (!item) {
      return res.status(404).json({ message: "Food item not found" });
    }

    Object.assign(item, body);
    await item.save();

    return res.status(200).json({ item });
  } catch (error) {
    // eslint-disable-next-line no-console
    console.error(error);
    return res.status(500).json({ message: "Internal server error" });
  }
};

export const deleteFoodItem = async (req: Request, res: Response) => {
  try {
    const userId = req.userId;
    if (!userId) {
      return res.status(401).json({ message: "Unauthorized" });
    }

    const { id } = req.params;

    const item = await FoodItem.findOneAndDelete({
      _id: id,
      created_by: userId,
    });

    if (!item) {
      return res.status(404).json({ message: "Food item not found" });
    }

    return res.status(200).json({ deleted: item });
  } catch (error) {
    // eslint-disable-next-line no-console
    console.error(error);
    return res.status(500).json({ message: "Internal server error" });
  }
};

export const uploadFoodItemImage = async (req: Request, res: Response) => {
  try {
    const userId = req.userId;
    if (!userId) {
      return res.status(401).json({ message: "Unauthorized" });
    }

    const { id } = req.params;

    if (!req.file) {
      return res.status(400).json({ message: "No file uploaded" });
    }

    const item = await FoodItem.findOne({ _id: id, created_by: userId });
    if (!item) {
      return res.status(404).json({ message: "Food item not found" });
    }

    // Upload image to Cloudinary
    const b64 = Buffer.from(req.file.buffer).toString("base64");
    const dataURI = `data:${req.file.mimetype};base64,${b64}`;

    const uploadResult = await cloudinary.uploader.upload(dataURI, {
      folder: "food_items",
      resource_type: "image",
      public_id: `food_${id}_${Date.now()}`,
    });

    item.image_url = uploadResult.secure_url;
    await item.save();

    return res.status(200).json({
      message: "Food item image updated successfully",
      image_url: item.image_url,
    });
  } catch (error) {
    // eslint-disable-next-line no-console
    console.error(error);
    return res.status(500).json({ message: "Internal server error" });
  }
};
