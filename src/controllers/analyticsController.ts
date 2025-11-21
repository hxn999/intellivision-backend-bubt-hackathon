import { Request, Response } from "express";
import {
  SingleDayAnalyticsInput,
  MonthlyFoodLogsInput,
  WeeklyFoodLogsInput,
} from "../validation/analyticsSchemas";
import { User } from "../models/User";
import { datesAreOnSameDay } from "../lib/utils/date";
import { IFoodItem } from "../models/FoodItem";

export interface IResult {
  calories: number;
  protein: number;
  carbohydrate: number;
  fat_total: number;
  fiber: number;
  sodium: number;
  cholesterol: number;
  potassium: number;
  vitamin_a: number;
  vitamin_c: number;
  vitamin_d: number;
  calcium: number;
  iron: number;
  magnesium: number;
}

export const getSingleDayAnalytics = async (req: Request, res: Response) => {
  try {
    const userId = req.userId;
    if (!userId) {
      return res.status(401).json({ message: "Unauthorized" });
    }

    const user = await User.findOne({ _id: userId }).populate(
      "foodLogs.foodItem"
    );

    if (!user) {
      return res.status(401).json({ message: "User not found" });
    }

    if (user.goals?.length == 0) {
      return res.status(401).json({ message: "User has no goals" });
    }

    const current_goal =
      user.goals && user.goals.length > 0
        ? user.goals[user.current_goal_index ? user.current_goal_index : 0]
        : null;

    if (!current_goal) {
      return res.status(401).json({ message: "User has no goals" });
    }

    const body = req.body as SingleDayAnalyticsInput;
    const date = body.date;

    // TODO: Add analytics logic here

    let logs = [];

    let result: IResult = {
      calcium: 0,
      calories: 0,
      carbohydrate: 0,
      cholesterol: 0,
      fat_total: 0,
      fiber: 0,
      iron: 0,
      magnesium: 0,
      potassium: 0,
      protein: 0,
      sodium: 0,
      vitamin_a: 0,
      vitamin_c: 0,
      vitamin_d: 0,
    };
    let result_percentage: IResult;

    if (user.foodLogs) {
      user.foodLogs.forEach((e) => {
        if (datesAreOnSameDay(e.date, date)) {
          logs.push(e);
          let foodItem = e.foodItem as unknown as IFoodItem;
          // Calculate the consumed amount as grams or ml for normalization (per 100g/ml)
          const consumedFactor = (e.quantity * foodItem.serving_quantity) / 100;

          result.calories += consumedFactor * foodItem.calories;
          result.protein += consumedFactor * foodItem.protein;
          result.carbohydrate += consumedFactor * foodItem.carbohydrate;
          result.fat_total += consumedFactor * foodItem.fat_total;
          if (foodItem.fiber) result.fiber += consumedFactor * foodItem.fiber;
          if (foodItem.sodium)
            result.sodium += consumedFactor * foodItem.sodium;
          if (foodItem.cholesterol)
            result.cholesterol += consumedFactor * foodItem.cholesterol;
          if (foodItem.potassium)
            result.potassium += consumedFactor * foodItem.potassium;
          if (foodItem.vitamin_a)
            result.vitamin_a += consumedFactor * foodItem.vitamin_a;
          if (foodItem.vitamin_c)
            result.vitamin_c += consumedFactor * foodItem.vitamin_c;
          if (foodItem.vitamin_d)
            result.vitamin_d += consumedFactor * foodItem.vitamin_d;
          if (foodItem.calcium)
            result.calcium += consumedFactor * foodItem.calcium;
          if (foodItem.iron) result.iron += consumedFactor * foodItem.iron;
          if (foodItem.magnesium)
            result.magnesium += consumedFactor * foodItem.magnesium;
        }
      });
    }

    // calculate percentage
    result_percentage = {
      calories: current_goal.calories
        ? (result.calories / current_goal.calories) * 100
        : 0,
      protein: current_goal.protein
        ? (result.protein / current_goal.protein) * 100
        : 0,
      carbohydrate: current_goal.carbohydrate
        ? (result.carbohydrate / current_goal.carbohydrate) * 100
        : 0,
      fat_total: current_goal.fat_total
        ? (result.fat_total / current_goal.fat_total) * 100
        : 0,
      fiber: current_goal.fiber ? (result.fiber / current_goal.fiber) * 100 : 0,
      sodium: current_goal.sodium
        ? (result.sodium / current_goal.sodium) * 100
        : 0,
      cholesterol: current_goal.cholesterol
        ? (result.cholesterol / current_goal.cholesterol) * 100
        : 0,
      potassium: current_goal.potassium
        ? (result.potassium / current_goal.potassium) * 100
        : 0,
      vitamin_a: current_goal.vitamin_a
        ? (result.vitamin_a / current_goal.vitamin_a) * 100
        : 0,
      vitamin_c: current_goal.vitamin_c
        ? (result.vitamin_c / current_goal.vitamin_c) * 100
        : 0,
      vitamin_d: current_goal.vitamin_d
        ? (result.vitamin_d / current_goal.vitamin_d) * 100
        : 0,
      calcium: current_goal.calcium
        ? (result.calcium / current_goal.calcium) * 100
        : 0,
      iron: current_goal.iron ? (result.iron / current_goal.iron) * 100 : 0,
      magnesium: current_goal.magnesium
        ? (result.magnesium / current_goal.magnesium) * 100
        : 0,
    };

    return res.status(200).json({
      message: "Single day analytics",
      date: body.date,
      result_percentage,
    });
  } catch (error) {
    // eslint-disable-next-line no-console
    console.error(error);
    return res.status(500).json({ message: "Internal server error" });
  }
};

export const getMonthlyFoodLogs = async (req: Request, res: Response) => {
  try {
    const userId = req.userId;
    if (!userId) {
      return res.status(401).json({ message: "Unauthorized" });
    }

    const body = req.body as MonthlyFoodLogsInput;
    const { year, month } = body;

    const user = await User.findById(userId).populate("foodLogs.foodItem");
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    // Get number of days in the month
    const daysInMonth = new Date(year, month, 0).getDate();

    // Create array to store daily logs
    const dailyLogs: Array<{
      date: string;
      logs: typeof user.foodLogs;
      summary: IResult;
    }> = [];

    // Iterate through each day of the month
    for (let day = 1; day <= daysInMonth; day++) {
      const currentDate = new Date(year, month - 1, day);
      const dayLogs: typeof user.foodLogs = [];

      const result: IResult = {
        calcium: 0,
        calories: 0,
        carbohydrate: 0,
        cholesterol: 0,
        fat_total: 0,
        fiber: 0,
        iron: 0,
        magnesium: 0,
        potassium: 0,
        protein: 0,
        sodium: 0,
        vitamin_a: 0,
        vitamin_c: 0,
        vitamin_d: 0,
      };

      // Filter food logs for this specific day
      if (user.foodLogs) {
        user.foodLogs.forEach((e) => {
          if (datesAreOnSameDay(e.date, currentDate)) {
            dayLogs.push(e);
            const foodItem = e.foodItem as unknown as IFoodItem;
            const consumedFactor =
              (e.quantity * foodItem.serving_quantity) / 100;

            result.calories += consumedFactor * foodItem.calories;
            result.protein += consumedFactor * foodItem.protein;
            result.carbohydrate += consumedFactor * foodItem.carbohydrate;
            result.fat_total += consumedFactor * foodItem.fat_total;
            if (foodItem.fiber) result.fiber += consumedFactor * foodItem.fiber;
            if (foodItem.sodium)
              result.sodium += consumedFactor * foodItem.sodium;
            if (foodItem.cholesterol)
              result.cholesterol += consumedFactor * foodItem.cholesterol;
            if (foodItem.potassium)
              result.potassium += consumedFactor * foodItem.potassium;
            if (foodItem.vitamin_a)
              result.vitamin_a += consumedFactor * foodItem.vitamin_a;
            if (foodItem.vitamin_c)
              result.vitamin_c += consumedFactor * foodItem.vitamin_c;
            if (foodItem.vitamin_d)
              result.vitamin_d += consumedFactor * foodItem.vitamin_d;
            if (foodItem.calcium)
              result.calcium += consumedFactor * foodItem.calcium;
            if (foodItem.iron) result.iron += consumedFactor * foodItem.iron;
            if (foodItem.magnesium)
              result.magnesium += consumedFactor * foodItem.magnesium;
          }
        });
      }

      dailyLogs.push({
        date: currentDate.toISOString().split("T")[0],
        logs: dayLogs,
        summary: result,
      });
    }

    return res.status(200).json({
      message: "Monthly food logs",
      year,
      month,
      dailyLogs,
    });
  } catch (error) {
    // eslint-disable-next-line no-console
    console.error(error);
    return res.status(500).json({ message: "Internal server error" });
  }
};

export const getWeeklyFoodLogs = async (req: Request, res: Response) => {
  try {
    const userId = req.userId;
    if (!userId) {
      return res.status(401).json({ message: "Unauthorized" });
    }

    const body = req.body as WeeklyFoodLogsInput;
    const startDate = new Date(body.startDate);

    const user = await User.findById(userId).populate("foodLogs.foodItem");
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    // Create array to store daily logs for 7 days
    const dailyLogs: Array<{
      date: string;
      dayOfWeek: string;
      logs: typeof user.foodLogs;
      summary: IResult;
    }> = [];

    const daysOfWeek = [
      "Sunday",
      "Monday",
      "Tuesday",
      "Wednesday",
      "Thursday",
      "Friday",
      "Saturday",
    ];

    // Iterate through 7 days starting from startDate
    for (let dayOffset = 0; dayOffset < 7; dayOffset++) {
      const currentDate = new Date(startDate);
      currentDate.setDate(startDate.getDate() + dayOffset);

      const dayLogs: typeof user.foodLogs = [];

      const result: IResult = {
        calcium: 0,
        calories: 0,
        carbohydrate: 0,
        cholesterol: 0,
        fat_total: 0,
        fiber: 0,
        iron: 0,
        magnesium: 0,
        potassium: 0,
        protein: 0,
        sodium: 0,
        vitamin_a: 0,
        vitamin_c: 0,
        vitamin_d: 0,
      };

      // Filter food logs for this specific day
      if (user.foodLogs) {
        user.foodLogs.forEach((e) => {
          if (datesAreOnSameDay(e.date, currentDate)) {
            dayLogs.push(e);
            const foodItem = e.foodItem as unknown as IFoodItem;
            const consumedFactor =
              (e.quantity * foodItem.serving_quantity) / 100;

            result.calories += consumedFactor * foodItem.calories;
            result.protein += consumedFactor * foodItem.protein;
            result.carbohydrate += consumedFactor * foodItem.carbohydrate;
            result.fat_total += consumedFactor * foodItem.fat_total;
            if (foodItem.fiber) result.fiber += consumedFactor * foodItem.fiber;
            if (foodItem.sodium)
              result.sodium += consumedFactor * foodItem.sodium;
            if (foodItem.cholesterol)
              result.cholesterol += consumedFactor * foodItem.cholesterol;
            if (foodItem.potassium)
              result.potassium += consumedFactor * foodItem.potassium;
            if (foodItem.vitamin_a)
              result.vitamin_a += consumedFactor * foodItem.vitamin_a;
            if (foodItem.vitamin_c)
              result.vitamin_c += consumedFactor * foodItem.vitamin_c;
            if (foodItem.vitamin_d)
              result.vitamin_d += consumedFactor * foodItem.vitamin_d;
            if (foodItem.calcium)
              result.calcium += consumedFactor * foodItem.calcium;
            if (foodItem.iron) result.iron += consumedFactor * foodItem.iron;
            if (foodItem.magnesium)
              result.magnesium += consumedFactor * foodItem.magnesium;
          }
        });
      }

      dailyLogs.push({
        date: currentDate.toISOString().split("T")[0],
        dayOfWeek: daysOfWeek[currentDate.getDay()],
        logs: dayLogs,
        summary: result,
      });
    }

    return res.status(200).json({
      message: "Weekly food logs",
      startDate: startDate.toISOString().split("T")[0],
      endDate: new Date(startDate.getTime() + 6 * 24 * 60 * 60 * 1000)
        .toISOString()
        .split("T")[0],
      dailyLogs,
    });
  } catch (error) {
    // eslint-disable-next-line no-console
    console.error(error);
    return res.status(500).json({ message: "Internal server error" });
  }
};
