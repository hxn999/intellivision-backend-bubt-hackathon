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
