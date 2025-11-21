import { Request, Response } from "express";
import { User } from "../models/User";
import { FoodInventory } from "../models/FoodInventory";
import { IFoodItem } from "../models/FoodItem";

interface ExpirationItem {
  foodItem: {
    _id: string;
    name: string;
    image_url?: string;
    expiration_hours: number;
  };
  createdAt: Date;
  hoursElapsed: number;
  hoursRemaining: number;
  percentageRemaining: number;
  status: "warning" | "wasted";
}

export const checkInventoryExpiration = async (req: Request, res: Response) => {
  try {
    const userId = req.userId;
    if (!userId) {
      return res.status(401).json({ message: "Unauthorized" });
    }

    // Get user with inventory
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    if (!user.inventory) {
      return res.status(400).json({
        message: "No inventory found. Please create an inventory first.",
      });
    }

    // Get inventory with populated food items
    const inventory = await FoodInventory.findById(user.inventory).populate(
      "foodItems"
    );

    if (
      !inventory ||
      !inventory.foodItems ||
      inventory.foodItems.length === 0
    ) {
      return res.status(200).json({
        message: "Inventory is empty",
        warning: [],
        wasted: [],
      });
    }

    const now = new Date();
    const inventoryCreatedAt = inventory.createdAt || now;

    const warning: ExpirationItem[] = [];
    const wasted: ExpirationItem[] = [];

    // Check each food item
    inventory.foodItems.forEach((item: any) => {
      const foodItem = item as IFoodItem;

      // Calculate hours elapsed since inventory creation
      const hoursElapsed =
        (now.getTime() - inventoryCreatedAt.getTime()) / (1000 * 60 * 60);

      // Calculate hours remaining
      const hoursRemaining = foodItem.expiration_hours - hoursElapsed;

      // Calculate percentage remaining
      const percentageRemaining =
        (hoursRemaining / foodItem.expiration_hours) * 100;

      // Create expiration item data
      const expirationData: ExpirationItem = {
        foodItem: {
          _id: foodItem._id.toString(),
          name: foodItem.name,
          image_url: foodItem.image_url,
          expiration_hours: foodItem.expiration_hours,
        },
        createdAt: inventoryCreatedAt,
        hoursElapsed: Math.round(hoursElapsed * 100) / 100,
        hoursRemaining: Math.round(hoursRemaining * 100) / 100,
        percentageRemaining: Math.round(percentageRemaining * 100) / 100,
        status: hoursRemaining <= 0 ? "wasted" : "warning",
      };

      // Categorize based on status
      if (hoursRemaining <= 0) {
        // Food has expired
        wasted.push(expirationData);
      } else if (percentageRemaining <= 40) {
        // Food is in warning zone (40% or less time remaining)
        warning.push(expirationData);
      }
    });

    // Sort by urgency (lowest hours remaining first)
    warning.sort((a, b) => a.hoursRemaining - b.hoursRemaining);
    wasted.sort((a, b) => a.hoursRemaining - b.hoursRemaining);

    return res.status(200).json({
      message: "Inventory expiration check completed",
      inventoryCreatedAt,
      totalItems: inventory.foodItems.length,
      warning: warning,
      wasted: wasted,
      summary: {
        warningCount: warning.length,
        wastedCount: wasted.length,
        healthyCount:
          inventory.foodItems.length - warning.length - wasted.length,
      },
    });
  } catch (error) {
    // eslint-disable-next-line no-console
    console.error(error);
    return res.status(500).json({ message: "Internal server error" });
  }
};
