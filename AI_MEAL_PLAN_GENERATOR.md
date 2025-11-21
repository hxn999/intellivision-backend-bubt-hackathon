# AI Meal Plan Generator API

## Overview

Generate personalized daily meal plans using AI that are based on:

- Your **nutritional goals** (calories, protein, carbs, fats, fiber)
- Your **food inventory** (only uses foods you have available)
- Your **preferences** (optional dietary preferences or restrictions)

The AI creates balanced, realistic meals that match your targets as closely as possible.

---

## Endpoints

### POST `/user/generate-meal-plan`

Generate an AI-powered daily meal plan from your inventory and goals. **The meal plan is automatically saved to your account** (replaces any existing meal plan).

**Authentication:** Required

**Request Body:**

```json
{
  "preferences": "I prefer high protein breakfast, vegetarian options",
  "mealCount": 3
}
```

**Validation:**

- `preferences`: string, optional - Any dietary preferences, restrictions, or meal instructions
- `mealCount`: integer, min 1, max 10, optional, default 3 - Number of meals to generate

**Response:** `200 OK`

```json
{
  "message": "Meal plan generated and saved successfully",
  "mealPlan": {
    "meals": [
      {
        "name": "Breakfast",
        "items": [
          {
            "foodItemId": "65abc123def456...",
            "foodItemName": "Oatmeal",
            "quantity": 1,
            "servingUnit": "cup"
          },
          {
            "foodItemId": "65def789ghi012...",
            "foodItemName": "Banana",
            "quantity": 1,
            "servingUnit": "medium"
          },
          {
            "foodItemId": "65ghi345jkl678...",
            "foodItemName": "Almonds",
            "quantity": 1,
            "servingUnit": "oz"
          }
        ],
        "totals": {
          "calories": 450,
          "protein": 15,
          "carbohydrate": 65,
          "fat_total": 15,
          "fiber": 10
        }
      },
      {
        "name": "Lunch",
        "items": [
          {
            "foodItemId": "65jkl901mno234...",
            "foodItemName": "Chicken Breast",
            "quantity": 2,
            "servingUnit": "100g"
          },
          {
            "foodItemId": "65mno567pqr890...",
            "foodItemName": "Brown Rice",
            "quantity": 1,
            "servingUnit": "cup"
          },
          {
            "foodItemId": "65pqr123stu456...",
            "foodItemName": "Broccoli",
            "quantity": 1,
            "servingUnit": "cup"
          }
        ],
        "totals": {
          "calories": 520,
          "protein": 60,
          "carbohydrate": 55,
          "fat_total": 8,
          "fiber": 6
        }
      },
      {
        "name": "Dinner",
        "items": [
          {
            "foodItemId": "65stu789vwx012...",
            "foodItemName": "Salmon",
            "quantity": 1,
            "servingUnit": "6 oz"
          },
          {
            "foodItemId": "65vwx345yza678...",
            "foodItemName": "Sweet Potato",
            "quantity": 1,
            "servingUnit": "medium"
          },
          {
            "foodItemId": "65yza901bcd234...",
            "foodItemName": "Spinach",
            "quantity": 2,
            "servingUnit": "cup"
          }
        ],
        "totals": {
          "calories": 580,
          "protein": 50,
          "carbohydrate": 45,
          "fat_total": 18,
          "fiber": 8
        }
      }
    ],
    "dailyTotals": {
      "calories": 1550,
      "protein": 125,
      "carbohydrate": 165,
      "fat_total": 41,
      "fiber": 24
    },
    "goalComparison": {
      "caloriesDiff": -50,
      "proteinDiff": 5,
      "carbsDiff": -15,
      "fatDiff": -9,
      "fiberDiff": -1
    }
  },
  "goal": {
    "calories": 1600,
    "protein": 120,
    "carbohydrate": 180,
    "fat_total": 50,
    "fiber": 25
  },
  "inventoryItemCount": 42
}
```

**Status Codes:**

- `200 OK`: Meal plan generated successfully
- `400 Bad Request`: No inventory, no goal, or empty inventory
- `401 Unauthorized`: Not authenticated
- `404 Not Found`: User not found
- `500 Internal Server Error`: AI generation failed or server error

---

### GET `/user/saved-meal-plan`

Retrieve the saved AI-generated meal plan for the authenticated user.

**Authentication:** Required

**Request Body:** None

**Response:** `200 OK`

```json
{
  "message": "Saved meal plan retrieved successfully",
  "mealPlan": {
    "meals": [
      {
        "name": "Breakfast",
        "items": [
          {
            "foodItemId": "65abc123def456...",
            "foodItemName": "Oatmeal",
            "quantity": 1,
            "servingUnit": "cup"
          }
        ],
        "totals": {
          "calories": 450,
          "protein": 15,
          "carbohydrate": 65,
          "fat_total": 15,
          "fiber": 10
        }
      }
    ],
    "dailyTotals": {
      "calories": 1550,
      "protein": 125,
      "carbohydrate": 165,
      "fat_total": 41,
      "fiber": 24
    },
    "goalComparison": {
      "caloriesDiff": -50,
      "proteinDiff": 5,
      "carbsDiff": -15,
      "fatDiff": -9,
      "fiberDiff": -1
    },
    "generatedAt": "2024-11-21T10:30:00.000Z",
    "preferences": "High protein, vegetarian"
  }
}
```

**Status Codes:**

- `200 OK`: Meal plan retrieved successfully
- `401 Unauthorized`: Not authenticated
- `404 Not Found`: User not found or no saved meal plan
- `500 Internal Server Error`: Server error

---

## How It Works

### 1. Prerequisites Check

The endpoint verifies you have:

- ✅ An active user account
- ✅ A food inventory with items
- ✅ An active nutritional goal

### 2. Data Collection

Gathers:

- Your current nutritional goals (calories, macros, fiber)
- All food items in your inventory
- Your preferences (if provided)

### 3. AI Generation

Sends to Gemini AI with instructions to:

- Use **ONLY** foods from your inventory
- Create the specified number of meals
- Match your nutritional goals as closely as possible
- Ensure meals are balanced and realistic

### 4. Response Processing

- Sanitizes AI response (removes markdown formatting)
- Parses JSON meal plan
- **Saves meal plan to user's database** (replaces existing plan)
- Returns structured data with goal comparison

---

## Request Examples

### Generate Meal Plan (3 meals, default)

```javascript
const response = await fetch("http://localhost:3000/user/generate-meal-plan", {
  method: "POST",
  credentials: "include",
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify({}), // Uses defaults
});

const data = await response.json();
console.log(data.mealPlan.meals);
// Meal plan is automatically saved to your account
```

### Get Saved Meal Plan

```javascript
const response = await fetch("http://localhost:3000/user/saved-meal-plan", {
  credentials: "include",
});

const data = await response.json();
console.log("Generated at:", data.mealPlan.generatedAt);
console.log("Preferences:", data.mealPlan.preferences);
console.log("Meals:", data.mealPlan.meals);
```

### With Preferences

```javascript
const response = await fetch("http://localhost:3000/user/generate-meal-plan", {
  method: "POST",
  credentials: "include",
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify({
    preferences: "High protein, low carb, vegetarian, no nuts",
    mealCount: 4,
  }),
});
```

### cURL

**Generate Meal Plan:**

```bash
curl -X POST http://localhost:3000/user/generate-meal-plan \
  -H "Cookie: access_token=YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "preferences": "I want breakfast to be high protein",
    "mealCount": 3
  }'
```

**Get Saved Meal Plan:**

```bash
curl http://localhost:3000/user/saved-meal-plan \
  -H "Cookie: access_token=YOUR_TOKEN"
```

---

## Response Structure

### Meal Object

```typescript
interface Meal {
  name: string; // e.g., "Breakfast", "Lunch", "Dinner"
  items: MealItem[];
  totals: NutritionalTotals;
}
```

### Meal Item Object

```typescript
interface MealItem {
  foodItemId: string; // MongoDB ObjectId from your inventory
  foodItemName: string; // Food name for display
  quantity: number; // Number of servings
  servingUnit: string; // e.g., "cup", "100g", "oz"
}
```

### Nutritional Totals

```typescript
interface NutritionalTotals {
  calories: number;
  protein: number;
  carbohydrate: number;
  fat_total: number;
  fiber: number;
}
```

### Goal Comparison

```typescript
interface GoalComparison {
  caloriesDiff: number; // Positive = over goal, Negative = under goal
  proteinDiff: number;
  carbsDiff: number;
  fatDiff: number;
  fiberDiff: number;
}
```

**Example:**

```json
{
  "caloriesDiff": -50 // 50 calories under goal
}
```

### Saved Meal Plan Object

```typescript
interface IAIGeneratedMealPlan {
  meals: Meal[];
  dailyTotals: NutritionalTotals;
  goalComparison: GoalComparison;
  generatedAt: Date; // When the plan was generated
  preferences?: string; // User's preferences used
}
```

---

## Use Cases

### 1. Daily Meal Planning

Generate a fresh meal plan each day:

```javascript
const generateDailyPlan = async () => {
  const response = await fetch("/user/generate-meal-plan", {
    method: "POST",
    credentials: "include",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ mealCount: 3 }),
  });

  const data = await response.json();

  // Display meals
  data.mealPlan.meals.forEach((meal) => {
    console.log(`\n${meal.name}:`);
    meal.items.forEach((item) => {
      console.log(`- ${item.quantity}x ${item.foodItemName}`);
    });
    console.log(`Total: ${meal.totals.calories} cal`);
  });
};
```

### 2. Load Saved Meal Plan

```javascript
const loadSavedPlan = async () => {
  const response = await fetch("/user/saved-meal-plan", {
    credentials: "include",
  });

  if (response.status === 404) {
    console.log("No saved meal plan. Generate one first!");
    return null;
  }

  const { mealPlan } = await response.json();

  console.log("Meal plan generated on:", new Date(mealPlan.generatedAt));
  console.log("Total calories:", mealPlan.dailyTotals.calories);
  console.log("Number of meals:", mealPlan.meals.length);

  return mealPlan;
};
```

### 3. Meal Plan Variations

Generate multiple options and let user choose:

```javascript
const generateVariations = async () => {
  const variations = [];

  // Generate 3 different meal plans
  for (let i = 0; i < 3; i++) {
    const response = await fetch("/user/generate-meal-plan", {
      method: "POST",
      credentials: "include",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        preferences:
          i === 0 ? "high protein" : i === 1 ? "low carb" : "balanced",
      }),
    });

    const data = await response.json();
    variations.push({
      type: i === 0 ? "High Protein" : i === 1 ? "Low Carb" : "Balanced",
      plan: data.mealPlan,
    });
  }

  // User can now choose which variation they prefer
  return variations;
};
```

### 4. Check Goal Alignment

```javascript
const checkAlignment = async () => {
  const response = await fetch("/user/generate-meal-plan", {
    method: "POST",
    credentials: "include",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({}),
  });

  const { mealPlan, goal } = await response.json();

  console.log("Goal Alignment:");
  console.log(
    `Calories: ${mealPlan.dailyTotals.calories}/${goal.calories} (${
      mealPlan.goalComparison.caloriesDiff > 0 ? "+" : ""
    }${mealPlan.goalComparison.caloriesDiff})`
  );
  console.log(
    `Protein: ${mealPlan.dailyTotals.protein}/${goal.protein}g (${
      mealPlan.goalComparison.proteinDiff > 0 ? "+" : ""
    }${mealPlan.goalComparison.proteinDiff}g)`
  );
};
```

---

## Preferences Examples

You can specify various preferences to customize the meal plan:

### Dietary Restrictions

```json
{
  "preferences": "vegetarian, no dairy, gluten-free"
}
```

### Meal Timing

```json
{
  "preferences": "light breakfast, heavy lunch, moderate dinner"
}
```

### Macros Focus

```json
{
  "preferences": "high protein breakfast, low carb lunch, balanced dinner"
}
```

### Ingredient Preferences

```json
{
  "preferences": "prefer chicken over beef, include vegetables in every meal, no processed foods"
}
```

### Combined

```json
{
  "preferences": "vegetarian, high protein, no nuts or soy, prefer whole grains"
}
```

---

## Error Handling

### No Inventory

```json
{
  "message": "No inventory found. Please create an inventory first."
}
```

**Solution:** Create inventory in registration or manually add one.

### Empty Inventory

```json
{
  "message": "Your inventory is empty. Please add food items first."
}
```

**Solution:** Add food items to your inventory via `/inventory/items` endpoint.

### No Active Goal

```json
{
  "message": "No active goal found. Please create a goal first."
}
```

**Solution:** Create a goal via `/user/goals` endpoint.

### No Saved Meal Plan

```json
{
  "message": "No saved meal plan found. Generate one first."
}
```

**Solution:** Generate a meal plan using POST `/user/generate-meal-plan`.

### AI Generation Failed

```json
{
  "message": "Failed to generate valid meal plan",
  "error": "AI response was not valid JSON"
}
```

**Cause:** AI returned invalid JSON or couldn't parse response.

**Solution:** Try again. The system includes sanitization to remove markdown formatting.

---

## Best Practices

### 1. Inventory Management

```javascript
// Ensure inventory is well-stocked before generating plans
const checkInventory = async () => {
  const response = await fetch("/inventory/items", {
    credentials: "include",
  });

  const { foodItems } = await response.json();

  if (foodItems.length < 10) {
    console.warn("Low inventory! Add more items for better meal plans.");
  }
};
```

### 2. Set Realistic Goals

```javascript
// Goals should be achievable with your inventory
// Example: Don't set high protein goal if inventory lacks protein sources
```

### 3. Specific Preferences

```javascript
// Be specific about preferences for better results
const goodPreferences =
  "High protein breakfast, include vegetables, low sodium";
const vaguePreferences = "Healthy food"; // Less effective
```

### 4. Meal Count

```javascript
// Typical meal counts:
// 3 = Breakfast, Lunch, Dinner
// 4 = Add morning snack
// 5 = Add morning and afternoon snacks
// 6 = 3 meals + 3 snacks

const mealCount = 3; // Most common
```

### 5. Check if Plan Exists

```javascript
// Always check if user has a saved plan before generating new one
const ensureMealPlan = async () => {
  try {
    const response = await fetch("/user/saved-meal-plan", {
      credentials: "include",
    });

    if (response.ok) {
      const { mealPlan } = await response.json();
      return mealPlan;
    }
  } catch (error) {
    // No saved plan, generate new one
  }

  // Generate new plan if none exists
  const generateResponse = await fetch("/user/generate-meal-plan", {
    method: "POST",
    credentials: "include",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ mealCount: 3 }),
  });

  const { mealPlan } = await generateResponse.json();
  return mealPlan;
};
```

---

## AI System Instructions

The AI is instructed to:

1. **Only use inventory items** - Won't suggest foods you don't have
2. **Meet nutritional goals** - Tries to match your targets closely
3. **Create balanced meals** - Ensures variety and nutritional balance
4. **Realistic portions** - Uses appropriate serving sizes
5. **Return valid JSON** - Structured data for easy parsing
6. **Auto-save** - Meal plan is automatically saved to user's account
7. **One plan per user** - New generations replace the previous plan

---

## Integration with Other Endpoints

### Complete Workflow

```javascript
// 1. Create/Update Goal
await fetch("/user/goals", {
  method: "POST",
  body: JSON.stringify({
    /* goal data */
  }),
});

// 2. Add Items to Inventory
await fetch("/inventory/items", {
  method: "POST",
  body: JSON.stringify({
    /* food items */
  }),
});

// 3. Generate Meal Plan
const mealPlanResponse = await fetch("/user/generate-meal-plan", {
  method: "POST",
  body: JSON.stringify({ mealCount: 3 }),
});

const { mealPlan } = await mealPlanResponse.json();

// 4. Save to Meal Plan (optional)
for (const meal of mealPlan.meals) {
  for (const item of meal.items) {
    await fetch("/user/meal-plan", {
      method: "POST",
      body: JSON.stringify({
        quantity: item.quantity,
        foodItemId: item.foodItemId,
      }),
    });
  }
}

// 5. Log meals as consumed
for (const meal of mealPlan.meals) {
  for (const item of meal.items) {
    await fetch("/user/food-logs", {
      method: "POST",
      body: JSON.stringify({
        foodItemId: item.foodItemId,
        quantity: item.quantity,
        date: new Date(),
      }),
    });
  }
}
```

---

## Performance Notes

- **Response Time:** 2-5 seconds for generation (depends on AI processing)
- **Rate Limiting:** Respect AI API rate limits
- **Inventory Size:** Works best with 10-50 items
- **Storage:** Only one meal plan stored per user (new plans replace old ones)
- **Retrieval:** Instant - saved plans load from database (no AI call)

---

## Tips for Better Meal Plans

### 1. Diverse Inventory

Keep a variety of:

- Protein sources (meat, fish, eggs, legumes)
- Carb sources (grains, rice, pasta, bread)
- Vegetables (leafy greens, cruciferous, root vegetables)
- Fruits (fresh or dried)
- Healthy fats (nuts, oils, avocado)
- Dairy/alternatives

### 2. Clear Preferences

```javascript
// Good examples:
"High protein breakfast with eggs, balanced lunch, light dinner";
"Vegetarian meals, include at least 2 vegetables per meal";
"Low carb lunch and dinner, normal breakfast";

// Less effective:
"Healthy";
"Good food";
```

### 3. Realistic Goals

Ensure your goals are achievable with your inventory. If you have limited protein sources but want 200g protein/day, the AI will struggle to create a satisfying plan.

---

**Your AI Meal Plan Generator is ready! Generate personalized, goal-aligned meal plans instantly! 🍽️🤖✨**
