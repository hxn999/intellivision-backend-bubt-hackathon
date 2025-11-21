import { Request, Response } from "express";
import bcrypt from "bcryptjs";
import { IUserGoal, User } from "../models/User";
import {
  AddFoodLogInput,
  CreateGoalInput,
  SetCurrentGoalInput,
  UpdateGoalInput,
  UpdateHealthProfileInput,
  UpdateProfileInput,
} from "../validation/userSchemas";
import { bmr } from "../lib/utils/metrics";
import cloudinary from "../config/cloudinary";
import { GoogleGenAI } from "@google/genai";

import dotenv from "dotenv";
dotenv.config();

export const getUser = async (req: Request, res: Response) => {
  try {
    const userId = req.userId;
    if (!userId) {
      return res.status(401).json({ message: "Unauthorized" });
    }

    const user = await User.findById(userId)
      .populate("foodLogs.foodItem")
      .populate({
        path: "inventory",
        populate: { path: "foodItems" },
      });

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    return res.status(200).json({
      user: {
        id: user.id,
        fullName: user.fullName,
        email: user.email,
        healthProfile: user.healthProfile,
        foodLogs: user.foodLogs,
        goals: user.goals,
        current_goal_index: user.current_goal_index,
        inventory: user.inventory,
      },
    });
  } catch (error) {
    // eslint-disable-next-line no-console
    console.error(error);
    return res.status(500).json({ message: "Internal server error" });
  }
};

export const updateHealthProfile = async (req: Request, res: Response) => {
  try {
    const userId = req.userId;
    if (!userId) {
      return res.status(401).json({ message: "Unauthorized" });
    }

    const body = req.body as UpdateHealthProfileInput;

    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    user.healthProfile = body;
    await user.save();

    return res.status(200).json({
      user: {
        id: user.id,
        fullName: user.fullName,
        email: user.email,
        healthProfile: user.healthProfile,
      },
    });
  } catch (error) {
    // eslint-disable-next-line no-console
    console.error(error);
    return res.status(500).json({ message: "Internal server error" });
  }
};

export const updateProfile = async (req: Request, res: Response) => {
  try {
    const userId = req.userId;
    if (!userId) {
      return res.status(401).json({ message: "Unauthorized" });
    }

    const body = req.body as UpdateProfileInput;

    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    if (body.fullName) {
      user.fullName = body.fullName;
    }

    if (body.newPassword) {
      const passwordMatches = await bcrypt.compare(
        body.currentPassword || "",
        user.password
      );

      if (!passwordMatches) {
        return res
          .status(401)
          .json({ message: "Current password is incorrect" });
      }

      const hashed = await bcrypt.hash(body.newPassword, 10);
      user.password = hashed;
    }

    await user.save();

    return res.status(200).json({
      user: {
        id: user.id,
        fullName: user.fullName,
        email: user.email,
      },
    });
  } catch (error) {
    // eslint-disable-next-line no-console
    console.error(error);
    return res.status(500).json({ message: "Internal server error" });
  }
};

export const addFoodLog = async (req: Request, res: Response) => {
  try {
    const userId = req.userId;
    if (!userId) {
      return res.status(401).json({ message: "Unauthorized" });
    }

    const body = req.body as AddFoodLogInput;

    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    const newLog = {
      date: body.date,
      time: body.time,
      foodItem: body.foodItemId,
      quantity: body.quantity,
    };

    user.foodLogs = user.foodLogs || [];
    user.foodLogs.push(newLog as any);
    await user.save();

    return res.status(201).json({
      foodLogs: user.foodLogs,
    });
  } catch (error) {
    // eslint-disable-next-line no-console
    console.error(error);
    return res.status(500).json({ message: "Internal server error" });
  }
};

export const deleteFoodLog = async (req: Request, res: Response) => {
  try {
    const userId = req.userId;
    if (!userId) {
      return res.status(401).json({ message: "Unauthorized" });
    }

    const index = Number(req.params.index);
    if (Number.isNaN(index) || index < 0) {
      return res.status(400).json({ message: "Invalid log index" });
    }

    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    if (!user.foodLogs || index >= user.foodLogs.length) {
      return res.status(404).json({ message: "Food log not found" });
    }

    const [removed] = user.foodLogs.splice(index, 1);
    await user.save();

    return res.status(200).json({
      deleted: removed,
      foodLogs: user.foodLogs,
    });
  } catch (error) {
    // eslint-disable-next-line no-console
    console.error(error);
    return res.status(500).json({ message: "Internal server error" });
  }
};

export const getGoals = async (req: Request, res: Response) => {
  try {
    const userId = req.userId;
    if (!userId) {
      return res.status(401).json({ message: "Unauthorized" });
    }

    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    return res.status(200).json({
      goals: user.goals ?? [],
      current_goal_index: user.current_goal_index ?? null,
    });
  } catch (error) {
    // eslint-disable-next-line no-console
    console.error(error);
    return res.status(500).json({ message: "Internal server error" });
  }
};

export const createGoal = async (req: Request, res: Response) => {
  try {
    const userId = req.userId;
    if (!userId) {
      return res.status(401).json({ message: "Unauthorized" });
    }

    const body = req.body as CreateGoalInput;

    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    let bmr_value = bmr(user);
    if (!bmr_value || !user.healthProfile?.activity_level_factor)
      return res
        .status(400)
        .json({ message: "Your profile is incomplete to create a goal" });
    let tdee = bmr_value * user.healthProfile?.activity_level_factor;

    let target_calories = tdee;
    let protein = body.current_weight_kg;

    if (body.primary_goals.includes("weight_loss")) {
      target_calories = tdee - 250;
      protein = body.current_weight_kg;
    }

    if (body.primary_goals.includes("maintenance")) {
      target_calories = tdee;
      protein = 1.2 * body.current_weight_kg;
    }
    if (body.primary_goals.includes("muscle_gain")) {
      target_calories = tdee + 300;
      protein = 1.8 * body.current_weight_kg;
    }

    let fat_total = (target_calories * 0.25) / 9;

    let fiber = 25;
    let carbohydrate = (target_calories - protein * 4 - fat_total * 9) / 4;

    if (!user.healthProfile?.gender) {
      return res
        .status(400)
        .json({ message: "Your profile is incomplete to create a goal" });
    }

    // Minerals (units in milligram)
    let sodium = 2300;
    let iron = 8;
    let magnesium = 410;
    let calcium = 1000;
    let potassium = 3400;
    let cholesterol = 300;

    // Vitamins
    let vitamin_a = 900; // μg (RAE)
    let vitamin_c = 90; // mg
    let vitamin_d = 15; // μg (IU)

    if (user.healthProfile?.gender == "female") {
      // Minerals
      iron = 18;
      magnesium = 310;
      potassium = 2600;

      // Vitamins
      vitamin_a = 700;
      vitamin_c = 75;
    }

    const goal: IUserGoal = {
      ...body,
      calories: target_calories,
      protein,
      carbohydrate,
      fat_total,
      fiber,
      sodium,
      cholesterol,
      iron,
      magnesium,
      calcium,
      potassium,
      vitamin_a,
      vitamin_c,
      vitamin_d,
    };

    user.goals = user.goals || [];
    user.goals.push(goal as any);

    // If this is the first goal, set it as current by default
    if (user.goals.length === 1) {
      user.current_goal_index = 0;
    }

    await user.save();

    return res.status(201).json({
      goals: user.goals,
      current_goal_index: user.current_goal_index ?? null,
    });
  } catch (error) {
    // eslint-disable-next-line no-console
    console.error(error);
    return res.status(500).json({ message: "Internal server error" });
  }
};

export const updateGoal = async (req: Request, res: Response) => {
  try {
    const userId = req.userId;
    if (!userId) {
      return res.status(401).json({ message: "Unauthorized" });
    }

    const index = Number(req.params.index);
    if (Number.isNaN(index) || index < 0) {
      return res.status(400).json({ message: "Invalid goal index" });
    }

    const body = req.body as UpdateGoalInput;

    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    if (!user.goals || index >= user.goals.length) {
      return res.status(404).json({ message: "Goal not found" });
    }

    const goal = user.goals[index] as any;

    if (body.primary_goals) goal.primary_goals = body.primary_goals;
    if (body.secondary_goals) goal.secondary_goals = body.secondary_goals;
    if (body.allergies) goal.allergies = body.allergies;
    if (body.activity_level) goal.activity_level = body.activity_level;
    if (body.target_weight_kg) goal.target_weight_kg = body.target_weight_kg;
    if (body.current_weight_kg) goal.current_weight_kg = body.current_weight_kg;

    await user.save();

    return res.status(200).json({
      goals: user.goals,
      current_goal_index: user.current_goal_index ?? null,
    });
  } catch (error) {
    // eslint-disable-next-line no-console
    console.error(error);
    return res.status(500).json({ message: "Internal server error" });
  }
};

export const deleteGoal = async (req: Request, res: Response) => {
  try {
    const userId = req.userId;
    if (!userId) {
      return res.status(401).json({ message: "Unauthorized" });
    }

    const index = Number(req.params.index);
    if (Number.isNaN(index) || index < 0) {
      return res.status(400).json({ message: "Invalid goal index" });
    }

    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    if (!user.goals || index >= user.goals.length) {
      return res.status(404).json({ message: "Goal not found" });
    }

    user.goals.splice(index, 1);

    // Adjust current_goal_index if necessary
    if (typeof user.current_goal_index === "number") {
      if (user.current_goal_index === index) {
        user.current_goal_index = null as any;
      } else if (user.current_goal_index > index) {
        user.current_goal_index -= 1;
      }
    }

    await user.save();

    return res.status(200).json({
      goals: user.goals,
      current_goal_index: user.current_goal_index ?? null,
    });
  } catch (error) {
    // eslint-disable-next-line no-console
    console.error(error);
    return res.status(500).json({ message: "Internal server error" });
  }
};

export const setCurrentGoal = async (req: Request, res: Response) => {
  try {
    const userId = req.userId;
    if (!userId) {
      return res.status(401).json({ message: "Unauthorized" });
    }

    const body = req.body as SetCurrentGoalInput;

    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    if (!user.goals || body.index >= user.goals.length) {
      return res.status(404).json({ message: "Goal not found" });
    }

    user.current_goal_index = body.index;
    await user.save();

    return res.status(200).json({
      goals: user.goals,
      current_goal_index: user.current_goal_index,
    });
  } catch (error) {
    // eslint-disable-next-line no-console
    console.error(error);
    return res.status(500).json({ message: "Internal server error" });
  }
};

export const uploadAIInventoryLog = async (req: Request, res: Response) => {
  try {
    const userId = req.userId;
    if (!userId) {
      return res.status(401).json({ message: "Unauthorized" });
    }

    if (!req.file) {
      return res.status(400).json({ message: "No image provided" });
    }

    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    // Upload to Cloudinary
    const cloudinary = (await import("../config/cloudinary")).default;

    // Convert buffer to base64 data URI for Cloudinary upload
    const base64Image = `data:${
      req.file.mimetype
    };base64,${req.file.buffer.toString("base64")}`;

    const result = await cloudinary.uploader.upload(base64Image, {
      folder: "ai_inventory_logs",
      resource_type: "image",
    });

    // Create image log object with unique ID
    const mongoose = (await import("mongoose")).default;
    const imageLog = {
      _id: new mongoose.Types.ObjectId().toString(),
      url: result.secure_url,
    };

    // Add image log to user's AI inventory logs
    if (!user.ai_generated_inventory_logs) {
      user.ai_generated_inventory_logs = [];
    }
    user.ai_generated_inventory_logs.push(imageLog as any);
    await user.save();

    // Perform OCR on the uploaded image
    try {
      const ocrApiKey = process.env.OCR_API_KEY;
      if (!ocrApiKey) {
        throw new Error("OCR_API_KEY not configured");
      }

      // Call OCR API
      const ocrResponse = await fetch(
        `https://api.ocr.space/parse/ImageUrl?apikey=${ocrApiKey}&url=${encodeURIComponent(
          result.secure_url
        )}`
      );
      const ocrData = await ocrResponse.json();

      console.log(ocrData);

      // Extract all parsed text
      let allParsedText = "";
      if (ocrData.ParsedResults && Array.isArray(ocrData.ParsedResults)) {
        allParsedText = ocrData.ParsedResults.map(
          (r: any) => r.ParsedText || ""
        ).join("\n");
      }

      if (!allParsedText.trim()) {
        return res.status(200).json({
          message:
            "AI inventory log image uploaded successfully (no text detected)",
          imageLog: imageLog,
          ai_generated_inventory_logs: user.ai_generated_inventory_logs,
          ocrText: allParsedText,
        });
      }

      // Use Gemini AI to generate food item JSON
      const ai = new GoogleGenAI({
        apiKey: "AIzaSyCii03U9Q6BYR3zJsJbS7uE2lokcBnEcus",
      });

      const systemInstruction = `You are a food inventory assistant. Given OCR text from a food product image, extract and return ONLY a valid JSON object (no markdown, no backticks, no formatting) with this exact structure:
{
  "name": "string",
  "description": "string (optional)",
  "serving_quantity": number,
  "serving_unit": "string (e.g., 'piece', 'cup', 'bottle')",
  "serving_weight_grams": number,
  "metric_serving_amount": number (default 100),
  "metric_serving_unit": "string (g or ml)",
  "calories": number,
  "protein": number,
  "carbohydrate": number,
  "fat_total": number,
  "fiber": number (optional),
  "sodium": number (optional),
  "expiration_hours": number (estimate based on product type),
  "tags": ["string array of relevant tags"],
  "allergens": ["string array of allergens if any"],
  "source": "AI_Generated"
}
If you cannot extract accurate nutritional information, provide reasonable estimates. Return ONLY the JSON object, nothing else.`;

      const aiResponse = await ai.models.generateContent({
        model: "gemini-2.0-flash",
        contents: `OCR Text from food product:\n\n${allParsedText}`,
        config: {
          systemInstruction: systemInstruction,
        },
      });

      const generatedText = (aiResponse.text || "")
        .trim()
        .replace(/```json|```/g, "")
        .trim();

      // console.log("Generated AI JSON:", generatedText);
      // Parse the JSON response
      let foodItemData;
      try {
        foodItemData = JSON.parse(generatedText);
      } catch (parseError) {
        // eslint-disable-next-line no-console
        console.error("Failed to parse AI response:", generatedText);
        return res.status(200).json({
          message: "Image uploaded but failed to parse food item",
          imageLog: imageLog,
          ai_generated_inventory_logs: user.ai_generated_inventory_logs,
          ocrText: allParsedText,
          aiResponse: generatedText,
          error: "Failed to parse AI response as JSON",
        });
      }

      // Create the food item
      const { FoodItem } = await import("../models/FoodItem");
      const foodItem = new FoodItem(foodItemData);
      await foodItem.save();

      // Add to user's inventory
      const { FoodInventory } = await import("../models/FoodInventory");

      // Get or create inventory
      let inventory;
      if (user.inventory) {
        inventory = await FoodInventory.findById(user.inventory);
      }

      if (!inventory) {
        // Create new inventory if it doesn't exist
        inventory = new FoodInventory({
          name: `${user.fullName}'s Inventory`,
          user: userId,
          foodItems: [],
        });
        await inventory.save();
        user.inventory = inventory._id;
        await user.save();
      }

      // Add food item to inventory if not already present
      const itemExists = inventory.foodItems.some(
        (item: any) => item.toString() === foodItem._id.toString()
      );

      if (!itemExists) {
        inventory.foodItems.push(foodItem._id);
        await inventory.save();
      }

      // Populate and return
      const populatedInventory = await FoodInventory.findById(
        inventory._id
      ).populate("foodItems");

      return res.status(200).json({
        message: "AI inventory log processed successfully",
        imageLog: imageLog,
        ai_generated_inventory_logs: user.ai_generated_inventory_logs,
        ocrText: allParsedText,
        generatedFoodItem: foodItem,
        inventory: populatedInventory,
      });
    } catch (aiError) {
      // eslint-disable-next-line no-console
      console.error("AI processing error:", aiError);

      // Still return success for image upload, but indicate AI processing failed
      return res.status(200).json({
        message: "Image uploaded but AI processing failed",
        imageLog: imageLog,
        ai_generated_inventory_logs: user.ai_generated_inventory_logs,
        error:
          aiError instanceof Error ? aiError.message : "AI processing failed",
      });
    }
  } catch (error) {
    // eslint-disable-next-line no-console
    console.error(error);
    return res.status(500).json({ message: "Internal server error" });
  }
};

export const uploadAIFoodLog = async (req: Request, res: Response) => {
  try {
    const userId = req.userId;
    if (!userId) {
      return res.status(401).json({ message: "Unauthorized" });
    }

    if (!req.file) {
      return res.status(400).json({ message: "No image provided" });
    }

    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    // Upload to Cloudinary
    const cloudinary = (await import("../config/cloudinary")).default;

    // Convert buffer to base64 data URI for Cloudinary upload
    const base64Image = `data:${
      req.file.mimetype
    };base64,${req.file.buffer.toString("base64")}`;

    const result = await cloudinary.uploader.upload(base64Image, {
      folder: "ai_food_logs",
      resource_type: "image",
    });

    // Create image log object with unique ID
    const mongoose = (await import("mongoose")).default;
    const imageLog = {
      _id: new mongoose.Types.ObjectId().toString(),
      url: result.secure_url,
    };

    // Add image log to user's AI food logs
    if (!user.ai_generated_food_logs) {
      user.ai_generated_food_logs = [];
    }
    user.ai_generated_food_logs.push(imageLog as any);
    await user.save();

    return res.status(200).json({
      message: "AI food log image uploaded successfully",
      imageLog: imageLog,
      ai_generated_food_logs: user.ai_generated_food_logs,
    });
  } catch (error) {
    // eslint-disable-next-line no-console
    console.error(error);
    return res.status(500).json({ message: "Internal server error" });
  }
};

export const getAIInventoryLogs = async (req: Request, res: Response) => {
  try {
    const userId = req.userId;
    if (!userId) {
      return res.status(401).json({ message: "Unauthorized" });
    }

    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    return res.status(200).json({
      ai_generated_inventory_logs: user.ai_generated_inventory_logs || [],
    });
  } catch (error) {
    // eslint-disable-next-line no-console
    console.error(error);
    return res.status(500).json({ message: "Internal server error" });
  }
};

export const getAIFoodLogs = async (req: Request, res: Response) => {
  try {
    const userId = req.userId;
    if (!userId) {
      return res.status(401).json({ message: "Unauthorized" });
    }

    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    return res.status(200).json({
      ai_generated_food_logs: user.ai_generated_food_logs || [],
    });
  } catch (error) {
    // eslint-disable-next-line no-console
    console.error(error);
    return res.status(500).json({ message: "Internal server error" });
  }
};

export const getMealPlan = async (req: Request, res: Response) => {
  try {
    const userId = req.userId;
    if (!userId) {
      return res.status(401).json({ message: "Unauthorized" });
    }

    const user = await User.findById(userId).populate("meal_plan.foodItem");
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    return res.status(200).json({
      meal_plan: user.meal_plan || [],
    });
  } catch (error) {
    // eslint-disable-next-line no-console
    console.error(error);
    return res.status(500).json({ message: "Internal server error" });
  }
};

export const addMealPlanItem = async (req: Request, res: Response) => {
  try {
    const userId = req.userId;
    if (!userId) {
      return res.status(401).json({ message: "Unauthorized" });
    }

    const body =
      req.body as import("../validation/userSchemas").AddMealPlanItemInput;

    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    // Verify food item exists
    const FoodItem = (await import("../models/FoodItem")).FoodItem;
    const foodItem = await FoodItem.findById(body.foodItemId);
    if (!foodItem) {
      return res.status(404).json({ message: "Food item not found" });
    }

    // Add to meal plan
    if (!user.meal_plan) {
      user.meal_plan = [];
    }

    user.meal_plan.push({
      quantity: body.quantity,
      foodItem: body.foodItemId,
    } as any);

    await user.save();

    // Populate before returning
    const populatedUser = await User.findById(userId).populate(
      "meal_plan.foodItem"
    );

    return res.status(201).json({
      message: "Item added to meal plan",
      meal_plan: populatedUser?.meal_plan || [],
    });
  } catch (error) {
    // eslint-disable-next-line no-console
    console.error(error);
    return res.status(500).json({ message: "Internal server error" });
  }
};

export const deleteMealPlanItem = async (req: Request, res: Response) => {
  try {
    const userId = req.userId;
    if (!userId) {
      return res.status(401).json({ message: "Unauthorized" });
    }

    const index = Number(req.params.index);
    if (Number.isNaN(index) || index < 0) {
      return res.status(400).json({ message: "Invalid meal plan item index" });
    }

    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    if (!user.meal_plan || index >= user.meal_plan.length) {
      return res.status(404).json({ message: "Meal plan item not found" });
    }

    const [removed] = user.meal_plan.splice(index, 1);
    await user.save();

    // Populate before returning
    const populatedUser = await User.findById(userId).populate(
      "meal_plan.foodItem"
    );

    return res.status(200).json({
      message: "Item removed from meal plan",
      deleted: removed,
      meal_plan: populatedUser?.meal_plan || [],
    });
  } catch (error) {
    // eslint-disable-next-line no-console
    console.error(error);
    return res.status(500).json({ message: "Internal server error" });
  }
};

// Chat Sessions
export const getChatSessions = async (req: Request, res: Response) => {
  try {
    const userId = req.userId;
    if (!userId) {
      return res.status(401).json({ message: "Unauthorized" });
    }

    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    return res.status(200).json({
      chatSessions: user.chatSessions || [],
    });
  } catch (error) {
    // eslint-disable-next-line no-console
    console.error(error);
    return res.status(500).json({ message: "Internal server error" });
  }
};

export const createChatSession = async (req: Request, res: Response) => {
  try {
    const userId = req.userId;
    if (!userId) {
      return res.status(401).json({ message: "Unauthorized" });
    }

    const body =
      req.body as import("../validation/userSchemas").CreateChatSessionInput;

    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    const mongoose = (await import("mongoose")).default;
    const newSession = {
      _id: new mongoose.Types.ObjectId().toString(),
      title: body.title,
      systemInstruction: body.systemInstruction,
      messages: [],
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    if (!user.chatSessions) {
      user.chatSessions = [];
    }

    user.chatSessions.push(newSession as any);
    await user.save();

    return res.status(201).json({
      message: "Chat session created",
      chatSession: newSession,
    });
  } catch (error) {
    // eslint-disable-next-line no-console
    console.error(error);
    return res.status(500).json({ message: "Internal server error" });
  }
};

export const getChatSession = async (req: Request, res: Response) => {
  try {
    const userId = req.userId;
    if (!userId) {
      return res.status(401).json({ message: "Unauthorized" });
    }

    const { sessionId } = req.params;

    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    const session = user.chatSessions?.find((s: any) => s._id === sessionId);
    if (!session) {
      return res.status(404).json({ message: "Chat session not found" });
    }

    return res.status(200).json({
      chatSession: session,
    });
  } catch (error) {
    // eslint-disable-next-line no-console
    console.error(error);
    return res.status(500).json({ message: "Internal server error" });
  }
};

export const sendChatMessage = async (req: Request, res: Response) => {
  try {
    const userId = req.userId;
    if (!userId) {
      return res.status(401).json({ message: "Unauthorized" });
    }

    const { sessionId } = req.params;
    const body =
      req.body as import("../validation/userSchemas").SendChatMessageInput;

    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    const sessionIndex = user.chatSessions?.findIndex(
      (s: any) => s._id === sessionId
    );
    if (
      sessionIndex === undefined ||
      sessionIndex === -1 ||
      !user.chatSessions
    ) {
      return res.status(404).json({ message: "Chat session not found" });
    }

    const session = user.chatSessions[sessionIndex] as any;

    // Add user message
    const userMessage = {
      role: "user" as const,
      content: body.message,
      timestamp: new Date(),
    };
    session.messages.push(userMessage);

    // Build conversation history for AI
    const conversationHistory = session.messages
      .map(
        (msg: any) =>
          `${msg.role === "user" ? "User" : "Assistant"}: ${msg.content}`
      )
      .join("\n\n");

    const fullPrompt = `${conversationHistory}\n\nAssistant:`;

    // Generate AI response using Gemini
    try {
      const { GoogleGenAI } = await import("@google/genai");
      const ai = new GoogleGenAI({});

      const config = session.systemInstruction
        ? { systemInstruction: session.systemInstruction }
        : {};

      const aiResponse = await ai.models.generateContent({
        model: "gemini-2.5-flash",
        contents: fullPrompt,
        config: config,
      });

      const aiText = (aiResponse.text || "").trim();

      // Add AI message
      const aiMessage = {
        role: "assistant" as const,
        content: aiText,
        timestamp: new Date(),
      };
      session.messages.push(aiMessage);

      // Update session timestamp
      session.updatedAt = new Date();

      await user.save();

      return res.status(200).json({
        message: "Message sent",
        userMessage,
        aiMessage,
        chatSession: session,
      });
    } catch (aiError) {
      // eslint-disable-next-line no-console
      console.error("AI error:", aiError);
      return res.status(500).json({
        message: "Failed to generate AI response",
        error: aiError instanceof Error ? aiError.message : "Unknown error",
      });
    }
  } catch (error) {
    // eslint-disable-next-line no-console
    console.error(error);
    return res.status(500).json({ message: "Internal server error" });
  }
};

export const deleteChatSession = async (req: Request, res: Response) => {
  try {
    const userId = req.userId;
    if (!userId) {
      return res.status(401).json({ message: "Unauthorized" });
    }

    const { sessionId } = req.params;

    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    const sessionIndex = user.chatSessions?.findIndex(
      (s: any) => s._id === sessionId
    );
    if (
      sessionIndex === undefined ||
      sessionIndex === -1 ||
      !user.chatSessions
    ) {
      return res.status(404).json({ message: "Chat session not found" });
    }

    const [deleted] = user.chatSessions.splice(sessionIndex, 1);
    await user.save();

    return res.status(200).json({
      message: "Chat session deleted",
      deleted,
    });
  } catch (error) {
    // eslint-disable-next-line no-console
    console.error(error);
    return res.status(500).json({ message: "Internal server error" });
  }
};

export const uploadProfileImage = async (req: Request, res: Response) => {
  try {
    const userId = req.userId;
    if (!userId) {
      return res.status(401).json({ message: "Unauthorized" });
    }

    if (!req.file) {
      return res.status(400).json({ message: "No file uploaded" });
    }

    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    // Upload image to Cloudinary
    const b64 = Buffer.from(req.file.buffer).toString("base64");
    const dataURI = `data:${req.file.mimetype};base64,${b64}`;

    const uploadResult = await cloudinary.uploader.upload(dataURI, {
      folder: "profile_images",
      resource_type: "image",
      public_id: `user_${userId}_${Date.now()}`,
    });

    user.image_url = uploadResult.secure_url;
    await user.save();

    return res.status(200).json({
      message: "Profile image updated successfully",
      image_url: user.image_url,
    });
  } catch (error) {
    // eslint-disable-next-line no-console
    console.error(error);
    return res.status(500).json({ message: "Internal server error" });
  }
};

// Get Saved AI Meal Plan
export const getSavedMealPlan = async (req: Request, res: Response) => {
  try {
    const userId = req.userId;
    if (!userId) {
      return res.status(401).json({ message: "Unauthorized" });
    }

    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    if (!user.ai_meal_plan) {
      return res.status(404).json({
        message: "No saved meal plan found. Generate one first.",
      });
    }

    return res.status(200).json({
      message: "Saved meal plan retrieved successfully",
      mealPlan: user.ai_meal_plan,
    });
  } catch (error) {
    // eslint-disable-next-line no-console
    console.error(error);
    return res.status(500).json({ message: "Internal server error" });
  }
};

// Generate AI Meal Plan
export const generateAIMealPlan = async (req: Request, res: Response) => {
  try {
    const userId = req.userId;
    if (!userId) {
      return res.status(401).json({ message: "Unauthorized" });
    }

    const body =
      req.body as import("../validation/userSchemas").GenerateMealPlanInput;

    // Fetch user with populated inventory and current goal
    const user = await User.findById(userId).populate({
      path: "inventory",
      populate: {
        path: "foodItems",
      },
    });

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    // Check if user has inventory
    if (!user.inventory) {
      return res.status(400).json({
        message: "No inventory found. Please create an inventory first.",
      });
    }

    // Get current goal
    const currentGoal =
      user.goals && user.goals.length > 0
        ? user.goals[user.current_goal_index ?? 0]
        : null;

    if (!currentGoal) {
      return res.status(400).json({
        message: "No active goal found. Please create a goal first.",
      });
    }

    // Get inventory items
    const { FoodInventory } = await import("../models/FoodInventory");
    const inventory = await FoodInventory.findById(user.inventory).populate(
      "foodItems"
    );

    if (
      !inventory ||
      !inventory.foodItems ||
      inventory.foodItems.length === 0
    ) {
      return res.status(400).json({
        message: "Your inventory is empty. Please add food items first.",
      });
    }

    // Prepare food items data for AI
    const foodItemsData = inventory.foodItems.map((item: any) => ({
      _id: item._id.toString(),
      name: item.name,
      description: item.description,
      calories: item.calories,
      protein: item.protein,
      carbohydrate: item.carbohydrate,
      fat_total: item.fat_total,
      fiber: item.fiber,
      serving_quantity: item.serving_quantity,
      serving_unit: item.serving_unit,
      price_per_unit_bdt: item.price_per_unit_bdt || 0,
    }));

    // Prepare goal data
    const goalData = {
      calories: currentGoal.calories,
      protein: currentGoal.protein,
      carbohydrate: currentGoal.carbohydrate,
      fat_total: currentGoal.fat_total,
      fiber: currentGoal.fiber,
    };

    // Create AI prompt
    const budgetInfo = body.budget
      ? `BUDGET: ${body.budget} BDT (Bangladeshi Taka) - Stay within this budget`
      : "";

    const systemInstruction = `You are a professional nutritionist and meal planner. Your task is to create a simple daily meal plan using the food items provided in the user's inventory.

IMPORTANT RULES:
1. PREFER to use food items from the provided inventory list
2. If the inventory lacks variety or essential nutrients, you MAY suggest adding missing items to improve the meal plan
3. If the inventory is insufficient for a balanced diet, provide recommendations in a "suggestions" field
4. Create exactly ${body.mealCount || 3} meal entries for the day
5. Include appropriate meal times (breakfast around 08:00am, lunch around 12:30pm, dinner around 07:00pm, snacks in between)
6. Calculate price based on price_per_unit_bdt × quantity
7. ${budgetInfo ? "Stay within the provided budget" : "Keep costs reasonable"}
8. Return ONLY valid JSON, no markdown formatting, no backticks, no extra text

Response format (MUST be valid JSON):
{
  "items": [
    {
      "foodItemName": "Oatmeal",
      "quantity": 1.5,
      "price": 45.50,
      "time_to_eat": "08:00am"
    },
    {
      "foodItemName": "Banana",
      "quantity": 2,
      "price": 20.00,
      "time_to_eat": "08:15am"
    },
    {
      "foodItemName": "Chicken Breast",
      "quantity": 2,
      "price": 180.00,
      "time_to_eat": "12:30pm"
    }
  ],
  "totalPrice": 245.50,
  "suggestions": "Optional: Add more vegetables like spinach and broccoli for better fiber intake. Consider adding eggs for breakfast protein."
}`;

    const userPrompt = `Create a daily meal plan for me.

MY NUTRITIONAL GOALS:
- Calories: ${goalData.calories} kcal
- Protein: ${goalData.protein}g
- Carbohydrates: ${goalData.carbohydrate}g
- Fat: ${goalData.fat_total}g
- Fiber: ${goalData.fiber}g

${body.budget ? `MY BUDGET: ${body.budget} BDT (stay within this limit)` : ""}

MY INVENTORY (available food items with prices):
${JSON.stringify(foodItemsData, null, 2)}

${body.preferences ? `PREFERENCES: ${body.preferences}` : ""}

Please create a meal plan with ${
      body.mealCount || 3
    } meal entries. Include appropriate meal times throughout the day. Calculate prices based on the price_per_unit_bdt field.`;

    // Generate meal plan using Gemini AI
    try {
      const ai = new GoogleGenAI({});

      const aiResponse = await ai.models.generateContent({
        model: "gemini-2.5-flash",
        contents: userPrompt,
        config: { systemInstruction },
      });

      const responseText = (aiResponse.text ?? "")
        .trim()
        .replace(/```json|```/g, "")
        .trim();

      // Parse AI response
      let mealPlan;
      try {
        mealPlan = JSON.parse(responseText);
      } catch (parseError) {
        // eslint-disable-next-line no-console
        console.error("Failed to parse AI response:", responseText);
        return res.status(500).json({
          message: "Failed to generate valid meal plan",
          error: "AI response was not valid JSON",
        });
      }

      // Validate meal plan structure
      if (!mealPlan.items || !Array.isArray(mealPlan.items)) {
        return res.status(500).json({
          message: "Failed to generate valid meal plan structure",
          error: "AI response missing items array",
        });
      }

      // Save meal plan to user's database
      user.ai_meal_plan = {
        items: mealPlan.items,
        totalPrice: mealPlan.totalPrice || 0,
        generatedAt: new Date(),
        preferences: body.preferences,
        budget: body.budget,
        suggestions: mealPlan.suggestions,
      } as any;

      await user.save();

      return res.status(200).json({
        message: "Meal plan generated and saved successfully",
        mealPlan: {
          items: mealPlan.items,
          totalPrice: mealPlan.totalPrice,
          suggestions: mealPlan.suggestions,
        },
        goal: goalData,
        budget: body.budget,
        inventoryItemCount: foodItemsData.length,
      });
    } catch (aiError) {
      // eslint-disable-next-line no-console
      console.error("AI error:", aiError);
      return res.status(500).json({
        message: "Failed to generate meal plan",
        error: aiError instanceof Error ? aiError.message : "Unknown AI error",
      });
    }
  } catch (error) {
    // eslint-disable-next-line no-console
    console.error(error);
    return res.status(500).json({ message: "Internal server error" });
  }
};
