import { Request, Response } from "express";
import {
  SingleDayAnalyticsInput,
  MonthlyFoodLogsInput,
  WeeklyFoodLogsInput,
} from "../validation/analyticsSchemas";
import { User } from "../models/User";
import { datesAreOnSameDay } from "../lib/utils/date";
import { IFoodItem } from "../models/FoodItem";
import { FoodInventory } from "../models/FoodInventory";

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

    // Get current goal
    const currentGoal =
      user.goals && user.goals.length > 0
        ? user.goals[user.current_goal_index ? user.current_goal_index : 0]
        : null;

    // Create array to store daily logs for 7 days
    const dailyLogs: Array<{
      date: string;
      dayOfWeek: string;
      logs: typeof user.foodLogs;
      summary: IResult;
      result_percentage?: IResult;
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

    // Weekly totals
    const weeklyTotals: IResult = {
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

      // Calculate percentage if goal exists
      let resultPercentage: IResult | undefined;
      if (currentGoal) {
        resultPercentage = {
          calories: currentGoal.calories
            ? (result.calories / currentGoal.calories) * 100
            : 0,
          protein: currentGoal.protein
            ? (result.protein / currentGoal.protein) * 100
            : 0,
          carbohydrate: currentGoal.carbohydrate
            ? (result.carbohydrate / currentGoal.carbohydrate) * 100
            : 0,
          fat_total: currentGoal.fat_total
            ? (result.fat_total / currentGoal.fat_total) * 100
            : 0,
          fiber: currentGoal.fiber
            ? (result.fiber / currentGoal.fiber) * 100
            : 0,
          sodium: currentGoal.sodium
            ? (result.sodium / currentGoal.sodium) * 100
            : 0,
          cholesterol: currentGoal.cholesterol
            ? (result.cholesterol / currentGoal.cholesterol) * 100
            : 0,
          potassium: currentGoal.potassium
            ? (result.potassium / currentGoal.potassium) * 100
            : 0,
          vitamin_a: currentGoal.vitamin_a
            ? (result.vitamin_a / currentGoal.vitamin_a) * 100
            : 0,
          vitamin_c: currentGoal.vitamin_c
            ? (result.vitamin_c / currentGoal.vitamin_c) * 100
            : 0,
          vitamin_d: currentGoal.vitamin_d
            ? (result.vitamin_d / currentGoal.vitamin_d) * 100
            : 0,
          calcium: currentGoal.calcium
            ? (result.calcium / currentGoal.calcium) * 100
            : 0,
          iron: currentGoal.iron ? (result.iron / currentGoal.iron) * 100 : 0,
          magnesium: currentGoal.magnesium
            ? (result.magnesium / currentGoal.magnesium) * 100
            : 0,
        };
      }

      // Add to weekly totals
      weeklyTotals.calories += result.calories;
      weeklyTotals.protein += result.protein;
      weeklyTotals.carbohydrate += result.carbohydrate;
      weeklyTotals.fat_total += result.fat_total;
      weeklyTotals.fiber += result.fiber;
      weeklyTotals.sodium += result.sodium;
      weeklyTotals.cholesterol += result.cholesterol;
      weeklyTotals.potassium += result.potassium;
      weeklyTotals.vitamin_a += result.vitamin_a;
      weeklyTotals.vitamin_c += result.vitamin_c;
      weeklyTotals.vitamin_d += result.vitamin_d;
      weeklyTotals.calcium += result.calcium;
      weeklyTotals.iron += result.iron;
      weeklyTotals.magnesium += result.magnesium;

      dailyLogs.push({
        date: currentDate.toISOString().split("T")[0],
        dayOfWeek: daysOfWeek[currentDate.getDay()],
        logs: dayLogs,
        summary: result,
        result_percentage: resultPercentage,
      });
    }

    // Calculate weekly averages
    const weeklyAverages: IResult = {
      calories: weeklyTotals.calories / 7,
      protein: weeklyTotals.protein / 7,
      carbohydrate: weeklyTotals.carbohydrate / 7,
      fat_total: weeklyTotals.fat_total / 7,
      fiber: weeklyTotals.fiber / 7,
      sodium: weeklyTotals.sodium / 7,
      cholesterol: weeklyTotals.cholesterol / 7,
      potassium: weeklyTotals.potassium / 7,
      vitamin_a: weeklyTotals.vitamin_a / 7,
      vitamin_c: weeklyTotals.vitamin_c / 7,
      vitamin_d: weeklyTotals.vitamin_d / 7,
      calcium: weeklyTotals.calcium / 7,
      iron: weeklyTotals.iron / 7,
      magnesium: weeklyTotals.magnesium / 7,
    };

    // Calculate weekly average percentages
    let weeklyAveragePercentages: IResult | undefined;
    if (currentGoal) {
      weeklyAveragePercentages = {
        calories: currentGoal.calories
          ? (weeklyAverages.calories / currentGoal.calories) * 100
          : 0,
        protein: currentGoal.protein
          ? (weeklyAverages.protein / currentGoal.protein) * 100
          : 0,
        carbohydrate: currentGoal.carbohydrate
          ? (weeklyAverages.carbohydrate / currentGoal.carbohydrate) * 100
          : 0,
        fat_total: currentGoal.fat_total
          ? (weeklyAverages.fat_total / currentGoal.fat_total) * 100
          : 0,
        fiber: currentGoal.fiber
          ? (weeklyAverages.fiber / currentGoal.fiber) * 100
          : 0,
        sodium: currentGoal.sodium
          ? (weeklyAverages.sodium / currentGoal.sodium) * 100
          : 0,
        cholesterol: currentGoal.cholesterol
          ? (weeklyAverages.cholesterol / currentGoal.cholesterol) * 100
          : 0,
        potassium: currentGoal.potassium
          ? (weeklyAverages.potassium / currentGoal.potassium) * 100
          : 0,
        vitamin_a: currentGoal.vitamin_a
          ? (weeklyAverages.vitamin_a / currentGoal.vitamin_a) * 100
          : 0,
        vitamin_c: currentGoal.vitamin_c
          ? (weeklyAverages.vitamin_c / currentGoal.vitamin_c) * 100
          : 0,
        vitamin_d: currentGoal.vitamin_d
          ? (weeklyAverages.vitamin_d / currentGoal.vitamin_d) * 100
          : 0,
        calcium: currentGoal.calcium
          ? (weeklyAverages.calcium / currentGoal.calcium) * 100
          : 0,
        iron: currentGoal.iron
          ? (weeklyAverages.iron / currentGoal.iron) * 100
          : 0,
        magnesium: currentGoal.magnesium
          ? (weeklyAverages.magnesium / currentGoal.magnesium) * 100
          : 0,
      };
    }

    // Generate AI suggestions if goal exists
    let aiSuggestions = "";
    if (currentGoal && weeklyAveragePercentages) {
      try {
        const { GoogleGenAI } = await import("@google/genai");
        const ai = new GoogleGenAI({});

        const prompt = `You are a professional nutritionist analyzing a user's weekly food consumption data.

WEEKLY AVERAGES (Daily Average):
- Calories: ${weeklyAverages.calories.toFixed(
          1
        )} kcal (${weeklyAveragePercentages.calories.toFixed(1)}% of goal: ${
          currentGoal.calories
        } kcal)
- Protein: ${weeklyAverages.protein.toFixed(
          1
        )}g (${weeklyAveragePercentages.protein.toFixed(1)}% of goal: ${
          currentGoal.protein
        }g)
- Carbohydrates: ${weeklyAverages.carbohydrate.toFixed(
          1
        )}g (${weeklyAveragePercentages.carbohydrate.toFixed(1)}% of goal: ${
          currentGoal.carbohydrate
        }g)
- Fat: ${weeklyAverages.fat_total.toFixed(
          1
        )}g (${weeklyAveragePercentages.fat_total.toFixed(1)}% of goal: ${
          currentGoal.fat_total
        }g)
- Fiber: ${weeklyAverages.fiber.toFixed(
          1
        )}g (${weeklyAveragePercentages.fiber.toFixed(1)}% of goal: ${
          currentGoal.fiber
        }g)
- Sodium: ${weeklyAverages.sodium.toFixed(
          1
        )}mg (${weeklyAveragePercentages.sodium.toFixed(1)}% of goal: ${
          currentGoal.sodium
        }mg)
- Vitamin A: ${weeklyAverages.vitamin_a.toFixed(
          1
        )}μg (${weeklyAveragePercentages.vitamin_a.toFixed(1)}% of goal: ${
          currentGoal.vitamin_a
        }μg)
- Vitamin C: ${weeklyAverages.vitamin_c.toFixed(
          1
        )}mg (${weeklyAveragePercentages.vitamin_c.toFixed(1)}% of goal: ${
          currentGoal.vitamin_c
        }mg)
- Vitamin D: ${weeklyAverages.vitamin_d.toFixed(
          1
        )}μg (${weeklyAveragePercentages.vitamin_d.toFixed(1)}% of goal: ${
          currentGoal.vitamin_d
        }μg)
- Calcium: ${weeklyAverages.calcium.toFixed(
          1
        )}mg (${weeklyAveragePercentages.calcium.toFixed(1)}% of goal: ${
          currentGoal.calcium
        }mg)
- Iron: ${weeklyAverages.iron.toFixed(
          1
        )}mg (${weeklyAveragePercentages.iron.toFixed(1)}% of goal: ${
          currentGoal.iron
        }mg)

DAILY BREAKDOWN:
${dailyLogs
  .map(
    (day, index) =>
      `Day ${index + 1} (${day.dayOfWeek}): ${day.summary.calories.toFixed(
        0
      )} kcal (${day.result_percentage?.calories.toFixed(1)}%)`
  )
  .join("\n")}

Analyze this weekly consumption data and provide suggestions in markdown format:

1. **General Consumption Trend**: Identify overall patterns (consistent, inconsistent, trending up/down) and what to improve
2. **Over/Under Consumption**: Detect specific nutrients that are consistently over or under the target
3. **Nutritional Imbalances**: Flag imbalanced ratios (e.g., high carbs but low protein) and provide actionable suggestions

Keep the response concise, actionable, and formatted in markdown with headers and bullet points. Focus on the most important issues.`;

        const aiResponse = await ai.models.generateContent({
          model: "gemini-2.5-flash",
          contents: prompt,
        });

        aiSuggestions = (aiResponse.text ?? "").trim();
      } catch (aiError) {
        // eslint-disable-next-line no-console
        console.error("AI suggestions error:", aiError);
        // Continue without suggestions if AI fails
      }
    }

    return res.status(200).json({
      message: "Weekly food logs",
      startDate: startDate.toISOString().split("T")[0],
      endDate: new Date(startDate.getTime() + 6 * 24 * 60 * 60 * 1000)
        .toISOString()
        .split("T")[0],
      dailyLogs,
      weeklyTotals,
      weeklyAverages,
      weeklyAveragePercentages,
      currentGoal: currentGoal
        ? {
            calories: currentGoal.calories,
            protein: currentGoal.protein,
            carbohydrate: currentGoal.carbohydrate,
            fat_total: currentGoal.fat_total,
            fiber: currentGoal.fiber,
          }
        : null,
      aiSuggestions: aiSuggestions || null,
    });
  } catch (error) {
    // eslint-disable-next-line no-console
    console.error(error);
    return res.status(500).json({ message: "Internal server error" });
  }
};

/**
 * GET /analytics/sdg-impact
 *
 * Generates an SDG (Sustainable Development Goals) impact score (1–100)
 * by combining:
 * - Weekly nutrition goal adherence (from the weekly analytics logic)
 * - Inventory expiration summary (warning / wasted / healthy counts)
 *
 * The response includes:
 * - overall score (1–100)
 * - component scores (nutrition vs. waste)
 * - weekly nutrition summary
 * - inventory expiration summary
 * - strengths (what you did right)
 * - improvements & action plan (what to do next)
 */
export const getSdgImpactReport = async (req: Request, res: Response) => {
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

    const currentGoal =
      user.goals && user.goals.length > 0
        ? user.goals[user.current_goal_index ? user.current_goal_index : 0]
        : null;

    if (!currentGoal) {
      return res.status(400).json({
        message:
          "User has no active nutrition goal. Please set a goal to calculate SDG impact.",
      });
    }

    // ---------- Weekly nutrition analytics (reuse weekly endpoint logic) ----------

    const daysOfWeek = [
      "Sunday",
      "Monday",
      "Tuesday",
      "Wednesday",
      "Thursday",
      "Friday",
      "Saturday",
    ];

    const weeklyTotals: IResult = {
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

    const dailySummaries: Array<{
      date: string;
      dayOfWeek: string;
      summary: IResult;
    }> = [];

    for (let dayOffset = 0; dayOffset < 7; dayOffset++) {
      const currentDate = new Date(startDate);
      currentDate.setDate(startDate.getDate() + dayOffset);

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

      if (user.foodLogs) {
        user.foodLogs.forEach((e) => {
          if (datesAreOnSameDay(e.date, currentDate)) {
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

      weeklyTotals.calories += result.calories;
      weeklyTotals.protein += result.protein;
      weeklyTotals.carbohydrate += result.carbohydrate;
      weeklyTotals.fat_total += result.fat_total;
      weeklyTotals.fiber += result.fiber;
      weeklyTotals.sodium += result.sodium;
      weeklyTotals.cholesterol += result.cholesterol;
      weeklyTotals.potassium += result.potassium;
      weeklyTotals.vitamin_a += result.vitamin_a;
      weeklyTotals.vitamin_c += result.vitamin_c;
      weeklyTotals.vitamin_d += result.vitamin_d;
      weeklyTotals.calcium += result.calcium;
      weeklyTotals.iron += result.iron;
      weeklyTotals.magnesium += result.magnesium;

      dailySummaries.push({
        date: currentDate.toISOString().split("T")[0],
        dayOfWeek: daysOfWeek[currentDate.getDay()],
        summary: result,
      });
    }

    const weeklyAverages: IResult = {
      calories: weeklyTotals.calories / 7,
      protein: weeklyTotals.protein / 7,
      carbohydrate: weeklyTotals.carbohydrate / 7,
      fat_total: weeklyTotals.fat_total / 7,
      fiber: weeklyTotals.fiber / 7,
      sodium: weeklyTotals.sodium / 7,
      cholesterol: weeklyTotals.cholesterol / 7,
      potassium: weeklyTotals.potassium / 7,
      vitamin_a: weeklyTotals.vitamin_a / 7,
      vitamin_c: weeklyTotals.vitamin_c / 7,
      vitamin_d: weeklyTotals.vitamin_d / 7,
      calcium: weeklyTotals.calcium / 7,
      iron: weeklyTotals.iron / 7,
      magnesium: weeklyTotals.magnesium / 7,
    };

    const weeklyAveragePercentages: IResult = {
      calories: currentGoal.calories
        ? (weeklyAverages.calories / currentGoal.calories) * 100
        : 0,
      protein: currentGoal.protein
        ? (weeklyAverages.protein / currentGoal.protein) * 100
        : 0,
      carbohydrate: currentGoal.carbohydrate
        ? (weeklyAverages.carbohydrate / currentGoal.carbohydrate) * 100
        : 0,
      fat_total: currentGoal.fat_total
        ? (weeklyAverages.fat_total / currentGoal.fat_total) * 100
        : 0,
      fiber: currentGoal.fiber
        ? (weeklyAverages.fiber / currentGoal.fiber) * 100
        : 0,
      sodium: currentGoal.sodium
        ? (weeklyAverages.sodium / currentGoal.sodium) * 100
        : 0,
      cholesterol: currentGoal.cholesterol
        ? (weeklyAverages.cholesterol / currentGoal.cholesterol) * 100
        : 0,
      potassium: currentGoal.potassium
        ? (weeklyAverages.potassium / currentGoal.potassium) * 100
        : 0,
      vitamin_a: currentGoal.vitamin_a
        ? (weeklyAverages.vitamin_a / currentGoal.vitamin_a) * 100
        : 0,
      vitamin_c: currentGoal.vitamin_c
        ? (weeklyAverages.vitamin_c / currentGoal.vitamin_c) * 100
        : 0,
      vitamin_d: currentGoal.vitamin_d
        ? (weeklyAverages.vitamin_d / currentGoal.vitamin_d) * 100
        : 0,
      calcium: currentGoal.calcium
        ? (weeklyAverages.calcium / currentGoal.calcium) * 100
        : 0,
      iron: currentGoal.iron
        ? (weeklyAverages.iron / currentGoal.iron) * 100
        : 0,
      magnesium: currentGoal.magnesium
        ? (weeklyAverages.magnesium / currentGoal.magnesium) * 100
        : 0,
    };

    // ---------- Nutrition score (0–70) ----------

    const clamp01 = (v: number) => Math.max(0, Math.min(1, v));

    const pct = weeklyAveragePercentages;

    const scoreForTarget100 = (value: number) => {
      const deviation = Math.abs(value - 100); // 0 is perfect
      // Full score when within ±10%, linearly drop to 0 at 60% deviation
      if (deviation <= 10) return 1;
      return clamp01(1 - (deviation - 10) / 50);
    };

    // For sodium, being below 100% is good; being too high is bad
    const scoreForSodium = (value: number) => {
      if (value <= 100) return 1;
      const deviation = value - 100;
      return clamp01(1 - deviation / 60);
    };

    const caloriesScore = scoreForTarget100(pct.calories);
    const proteinScore = scoreForTarget100(pct.protein);
    const fiberScore = scoreForTarget100(pct.fiber);
    const sodiumScore = scoreForSodium(pct.sodium);

    const nutritionScore01 =
      caloriesScore * 0.4 +
      proteinScore * 0.3 +
      fiberScore * 0.2 +
      sodiumScore * 0.1;
    const nutritionScore = nutritionScore01 * 70;

    // ---------- Inventory expiration summary & waste score (0–30) ----------

    let warningCount = 0;
    let wastedCount = 0;
    let healthyCount = 0;
    let totalItems = 0;

    if (user.inventory) {
      const inventory = await FoodInventory.findById(user.inventory).populate(
        "foodItems"
      );

      if (inventory && inventory.foodItems && inventory.foodItems.length > 0) {
        const now = new Date();

        let inventoryCreatedAt: Date;
        if (inventory.createdAt instanceof Date) {
          inventoryCreatedAt = inventory.createdAt;
        } else if (
          inventory._id &&
          typeof (inventory._id as any).getTimestamp === "function"
        ) {
          inventoryCreatedAt = (inventory._id as any).getTimestamp();
        } else {
          inventoryCreatedAt = now;
        }

        totalItems = inventory.foodItems.length;

        inventory.foodItems.forEach((item: any) => {
          const foodItem = item as IFoodItem;

          const hoursElapsed =
            (now.getTime() - inventoryCreatedAt.getTime()) / (1000 * 60 * 60);
          const hoursRemaining = foodItem.expiration_hours - hoursElapsed;
          const percentageRemaining =
            (hoursRemaining / foodItem.expiration_hours) * 100;

          if (hoursRemaining <= 0) {
            wastedCount += 1;
          } else if (percentageRemaining <= 40) {
            warningCount += 1;
          } else {
            healthyCount += 1;
          }
        });
      }
    }

    const effectiveTotal = totalItems || 1;
    const wasteRatio = wastedCount / effectiveTotal;
    const warningRatio = warningCount / effectiveTotal;

    // Heuristic: heavy penalty for waste, lighter for items close to expiry
    let wasteScore01 = 1 - (wasteRatio * 0.7 + warningRatio * 0.3);
    wasteScore01 = clamp01(wasteScore01);
    const wasteScore = wasteScore01 * 30;

    // If there is no inventory at all, treat as neutral-good (no waste)
    const finalWasteScore =
      totalItems === 0 ? 0.7 * 30 /* 70% of max */ : wasteScore;

    // ---------- Overall SDG score (1–100) ----------

    const rawScore = nutritionScore + finalWasteScore;
    const score = Math.max(1, Math.min(100, Math.round(rawScore)));

    // ---------- Narrative summary (what went well / what to improve) ----------

    const strengths: string[] = [];
    const improvements: string[] = [];

    // Nutrition strengths
    if (pct.calories >= 90 && pct.calories <= 110) {
      strengths.push(
        "Your average daily calories for the week stayed close to your target, which supports stable energy and weight management."
      );
    }
    if (pct.protein >= 90 && pct.protein <= 110) {
      strengths.push(
        "Your protein intake is close to your goal, which is great for muscle maintenance and recovery (SDG 3: Good Health & Well-being)."
      );
    }
    if (pct.fiber >= 80) {
      strengths.push(
        "You are getting a solid amount of fiber, supporting gut health and long-term disease prevention."
      );
    }
    if (pct.sodium <= 100 && pct.sodium > 0) {
      strengths.push(
        "You kept sodium intake at or below your target, which is beneficial for heart health."
      );
    }

    // Waste-related strengths
    if (totalItems > 0 && wastedCount === 0) {
      strengths.push(
        "You did not waste any inventory items this week, strongly supporting SDG 12: Responsible Consumption and Production."
      );
    }
    if (totalItems > 0 && warningRatio < 0.2) {
      strengths.push(
        "Most of your stored food is in a healthy zone with plenty of time before expiration."
      );
    }
    if (totalItems === 0) {
      strengths.push(
        "You currently have no stored inventory, which means there is no food waste from your pantry or fridge."
      );
    }

    // Nutrition improvements
    if (pct.calories > 110) {
      improvements.push(
        "Reduce overall calorie intake slightly by cutting down on calorie-dense snacks or sugary drinks to move closer to your target."
      );
    } else if (pct.calories < 90 && pct.calories > 0) {
      improvements.push(
        "Increase your calorie intake a bit with nutrient-dense foods (whole grains, healthy fats, lean protein) so you reach your energy target."
      );
    }

    if (pct.protein < 80 && currentGoal.protein) {
      improvements.push(
        "Add 1–2 high-protein servings daily (e.g., beans, lentils, eggs, yogurt, tofu) to better support muscle health."
      );
    }

    if (pct.fiber < 80 && currentGoal.fiber) {
      improvements.push(
        "Boost fiber by including more fruits, vegetables, whole grains, and legumes in your meals."
      );
    }

    if (pct.sodium > 110 && currentGoal.sodium) {
      improvements.push(
        "Limit highly processed and salty foods, and taste dishes before adding extra salt to bring sodium closer to your goal."
      );
    }

    // Waste-related improvements
    if (wastedCount > 0) {
      improvements.push(
        "You had items that expired unused—plan meals around foods that are closest to expiring to cut down on waste (SDG 12)."
      );
    }
    if (warningCount > 0) {
      improvements.push(
        "Several items are close to expiring—prioritize them in the next few meals or freeze portions to extend their life."
      );
    }

    if (improvements.length === 0) {
      improvements.push(
        "Keep following your current habits; they already align well with your nutrition goals and responsible food usage."
      );
    }

    const actionPlan =
      "Over the next week, focus on 2–3 small, realistic changes: " +
      improvements.slice(0, 3).join(" ") +
      " Re-check your SDG impact score weekly to track how these changes improve both your health and your food sustainability footprint.";

    return res.status(200).json({
      message: "SDG impact report",
      score,
      components: {
        nutritionScore: Math.round(nutritionScore),
        wasteScore: Math.round(finalWasteScore),
      },
      period: {
        startDate: startDate.toISOString().split("T")[0],
        endDate: new Date(startDate.getTime() + 6 * 24 * 60 * 60 * 1000)
          .toISOString()
          .split("T")[0],
      },
      weeklySummary: {
        weeklyAverages,
        weeklyAveragePercentages: {
          calories: Number(weeklyAveragePercentages.calories.toFixed(1)),
          protein: Number(weeklyAveragePercentages.protein.toFixed(1)),
          carbohydrate: Number(
            weeklyAveragePercentages.carbohydrate.toFixed(1)
          ),
          fat_total: Number(weeklyAveragePercentages.fat_total.toFixed(1)),
          fiber: Number(weeklyAveragePercentages.fiber.toFixed(1)),
          sodium: Number(weeklyAveragePercentages.sodium.toFixed(1)),
          cholesterol: Number(weeklyAveragePercentages.cholesterol.toFixed(1)),
          potassium: Number(weeklyAveragePercentages.potassium.toFixed(1)),
          vitamin_a: Number(weeklyAveragePercentages.vitamin_a.toFixed(1)),
          vitamin_c: Number(weeklyAveragePercentages.vitamin_c.toFixed(1)),
          vitamin_d: Number(weeklyAveragePercentages.vitamin_d.toFixed(1)),
          calcium: Number(weeklyAveragePercentages.calcium.toFixed(1)),
          iron: Number(weeklyAveragePercentages.iron.toFixed(1)),
          magnesium: Number(weeklyAveragePercentages.magnesium.toFixed(1)),
        },
      },
      inventorySummary: {
        totalItems,
        warningCount,
        wastedCount,
        healthyCount,
      },
      strengths,
      improvements,
      actionPlan,
    });
  } catch (error) {
    // eslint-disable-next-line no-console
    console.error(error);
    return res.status(500).json({ message: "Internal server error" });
  }
};
