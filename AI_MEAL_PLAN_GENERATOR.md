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
  "mealCount": 3,
  "budget": 500
}
```

**Validation:**

- `preferences`: string, optional - Any dietary preferences, restrictions, or meal instructions
- `mealCount`: integer, min 1, max 10, optional, default 3 - Number of meal entries to generate
- `budget`: number, optional - Budget in BDT (Bangladeshi Taka), AI will stay within this limit

**Response:** `200 OK`

```json
{
  "message": "Meal plan generated and saved successfully",
  "mealPlan": {
    "items": [
      {
        "foodItemName": "Oatmeal",
        "quantity": 1.5,
        "price": 45.5,
        "time_to_eat": "08:00am"
      },
      {
        "foodItemName": "Banana",
        "quantity": 2,
        "price": 20.0,
        "time_to_eat": "08:15am"
      },
      {
        "foodItemName": "Almonds",
        "quantity": 0.5,
        "price": 75.0,
        "time_to_eat": "10:30am"
      },
      {
        "foodItemName": "Chicken Breast",
        "quantity": 2,
        "price": 180.0,
        "time_to_eat": "12:30pm"
      },
      {
        "foodItemName": "Brown Rice",
        "quantity": 1,
        "price": 30.0,
        "time_to_eat": "12:35pm"
      },
      {
        "foodItemName": "Broccoli",
        "quantity": 1,
        "price": 40.0,
        "time_to_eat": "12:40pm"
      },
      {
        "foodItemName": "Apple",
        "quantity": 1,
        "price": 25.0,
        "time_to_eat": "04:00pm"
      },
      {
        "foodItemName": "Salmon",
        "quantity": 1,
        "price": 250.0,
        "time_to_eat": "07:00pm"
      },
      {
        "foodItemName": "Sweet Potato",
        "quantity": 1,
        "price": 35.0,
        "time_to_eat": "07:10pm"
      }
    ],
    "totalPrice": 700.5,
    "suggestions": "Consider adding more vegetables like spinach and broccoli for better fiber intake. Your inventory is low on vitamin C sources - adding oranges or bell peppers would improve nutritional balance."
  },
  "goal": {
    "calories": 1600,
    "protein": 120,
    "carbohydrate": 180,
    "fat_total": 50,
    "fiber": 25
  },
  "budget": 500,
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
- Your budget (if provided)

### 3. AI Generation

Sends to Gemini AI with instructions to:

- **Prefer** foods from your inventory
- Create the specified number of meals with times
- Match your nutritional goals and budget
- **Provide suggestions** if inventory lacks variety or essential nutrients
- Include recommendations for improving meal quality

### 4. Response Processing

- Sanitizes AI response (removes markdown formatting)
- Parses JSON meal plan
- **Saves meal plan to user's database** (replaces existing plan)
- Returns structured data with suggestions (if any)

---

## Request Examples

### Generate Meal Plan with Budget

```javascript
const response = await fetch("http://localhost:3000/user/generate-meal-plan", {
  method: "POST",
  credentials: "include",
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify({
    mealCount: 5,
    budget: 500, // 500 BDT budget
    preferences: "High protein",
  }),
});

const data = await response.json();
console.log(data.mealPlan.items); // Array of meal items with times
console.log(`Total Cost: ${data.mealPlan.totalPrice} BDT`);

// Check if AI provided suggestions
if (data.mealPlan.suggestions) {
  console.log("\n💡 AI Suggestions:");
  console.log(data.mealPlan.suggestions);
}
// Meal plan is automatically saved to your account
```

### Get Saved Meal Plan

```javascript
const response = await fetch("http://localhost:3000/user/saved-meal-plan", {
  credentials: "include",
});

const data = await response.json();
console.log("Generated at:", data.mealPlan.generatedAt);
console.log("Total Price:", data.mealPlan.totalPrice, "BDT");
console.log("Budget:", data.mealPlan.budget, "BDT");
console.log("Items:", data.mealPlan.items);

// Display schedule
data.mealPlan.items.forEach((item) => {
  console.log(
    `${item.time_to_eat}: ${item.foodItemName} (${item.quantity}) - ${item.price} BDT`
  );
});

// Check for AI suggestions
if (data.mealPlan.suggestions) {
  console.log("\n💡 AI Recommendations:");
  console.log(data.mealPlan.suggestions);
}
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
    "mealCount": 5,
    "budget": 600
  }'
```

**Get Saved Meal Plan:**

```bash
curl http://localhost:3000/user/saved-meal-plan \
  -H "Cookie: access_token=YOUR_TOKEN"
```

---

## Response Structure

### Meal Plan Item Object

```typescript
interface IAIMealPlanItem {
  foodItemName: string; // Name of the food
  quantity: number; // Quantity/servings
  price: number; // Cost in BDT (Bangladeshi Taka)
  time_to_eat: string; // Time in format hh:mma (e.g., "08:30am", "12:00pm")
}
```

### Meal Plan Object

```typescript
interface MealPlan {
  items: IAIMealPlanItem[]; // Array of meal items
  totalPrice: number; // Total cost in BDT
  suggestions?: string; // AI's recommendations for improving the plan
}
```

### Saved Meal Plan Object

```typescript
interface IAIGeneratedMealPlan {
  items: IAIMealPlanItem[];
  totalPrice: number;
  generatedAt: Date; // When the plan was generated
  preferences?: string; // User's preferences used
  budget?: number; // Budget in BDT (if provided)
  suggestions?: string; // AI's recommendations for inventory improvement
}
```

---

## Use Cases

### 1. Daily Meal Planning with Budget

Generate a fresh meal plan with budget constraint:

```javascript
const generateDailyPlan = async () => {
  const response = await fetch("/user/generate-meal-plan", {
    method: "POST",
    credentials: "include",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      mealCount: 6,
      budget: 500, // 500 BDT daily budget
    }),
  });

  const { mealPlan, budget } = await response.json();

  // Display meal schedule
  console.log(`Daily Budget: ${budget} BDT`);
  console.log(`Total Cost: ${mealPlan.totalPrice} BDT`);
  console.log(`Remaining: ${budget - mealPlan.totalPrice} BDT\n`);

  mealPlan.items.forEach((item) => {
    console.log(
      `${item.time_to_eat} - ${item.foodItemName} (${item.quantity}) - ${item.price} BDT`
    );
  });
};
```

### 2. Load Saved Meal Plan & Display Schedule

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

  console.log(
    "Generated on:",
    new Date(mealPlan.generatedAt).toLocaleDateString()
  );
  console.log("Total Cost:", mealPlan.totalPrice, "BDT");
  if (mealPlan.budget) {
    console.log("Budget:", mealPlan.budget, "BDT");
    const saved = mealPlan.budget - mealPlan.totalPrice;
    console.log(
      saved >= 0
        ? `Under budget by ${saved} BDT ✅`
        : `Over budget by ${-saved} BDT ⚠️`
    );
  }
  console.log("\n📅 Meal Schedule:");

  mealPlan.items.forEach((item) => {
    console.log(
      `  ${item.time_to_eat}: ${item.foodItemName} (${item.quantity}) - ${item.price} BDT`
    );
  });

  return mealPlan;
};
```

### 3. Handle AI Suggestions

```javascript
const generateAndImprove = async () => {
  const response = await fetch("/user/generate-meal-plan", {
    method: "POST",
    credentials: "include",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      mealCount: 5,
      budget: 500,
    }),
  });

  const { mealPlan } = await response.json();

  // Display meal plan
  console.log("📅 Today's Meal Plan:");
  mealPlan.items.forEach((item) => {
    console.log(
      `${item.time_to_eat}: ${item.foodItemName} - ${item.price} BDT`
    );
  });
  console.log(`\nTotal Cost: ${mealPlan.totalPrice} BDT`);

  // Check for AI suggestions
  if (mealPlan.suggestions) {
    console.log("\n💡 AI Recommendations to Improve Your Inventory:");
    console.log(mealPlan.suggestions);

    // Optionally, create shopping list from suggestions
    const shoppingList = extractItemsFromSuggestions(mealPlan.suggestions);
    console.log("\n🛒 Suggested Shopping List:", shoppingList);
  } else {
    console.log("\n✅ Your inventory is well-balanced!");
  }
};
```

### 4. Budget Tracking

```javascript
const trackBudget = async (weeklyBudget) => {
  const dailyBudget = weeklyBudget / 7;

  const response = await fetch("/user/generate-meal-plan", {
    method: "POST",
    credentials: "include",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      mealCount: 5,
      budget: dailyBudget,
    }),
  });

  const { mealPlan } = await response.json();

  console.log(`Daily Budget: ${dailyBudget} BDT`);
  console.log(`Actual Cost: ${mealPlan.totalPrice} BDT`);

  const diff = dailyBudget - mealPlan.totalPrice;
  if (diff >= 0) {
    console.log(`✅ Under budget by ${diff.toFixed(2)} BDT`);
  } else {
    console.log(`⚠️ Over budget by ${Math.abs(diff).toFixed(2)} BDT`);
  }

  // Weekly projection
  console.log(`\n📊 Weekly Projection:`);
  console.log(`  Budget: ${weeklyBudget} BDT`);
  console.log(`  Estimated Cost: ${(mealPlan.totalPrice * 7).toFixed(2)} BDT`);
  console.log(`  Savings: ${(diff * 7).toFixed(2)} BDT`);
};

// Track with 3500 BDT weekly budget
trackBudget(3500);
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

## AI Suggestions Feature

### What It Does

The AI analyzes your inventory and provides personalized recommendations if:

- **Lacks variety** - Not enough different food types
- **Missing nutrients** - Insufficient sources of vitamins, minerals, or macros
- **Budget constraints** - Suggests cost-effective alternatives
- **Nutritional gaps** - Identifies missing food groups

### Example Suggestions

```json
{
  "suggestions": "Your inventory lacks vitamin C sources. Consider adding oranges, bell peppers, or strawberries. Also, adding more leafy greens like spinach would improve iron and fiber intake. For better protein variety, consider adding eggs or legumes."
}
```

### How to Use Suggestions

```javascript
const { mealPlan } = await generateMealPlan({ budget: 500 });

if (mealPlan.suggestions) {
  console.log("💡 AI Recommendations:");
  console.log(mealPlan.suggestions);

  // Parse suggestions and update shopping list
  const missingItems = parseSuggestions(mealPlan.suggestions);
  addToShoppingList(missingItems);
}
```

### Common Suggestion Types

1. **Nutrient Gaps**

   ```
   "Low in vitamin C. Add citrus fruits or bell peppers."
   ```

2. **Protein Sources**

   ```
   "Limited protein variety. Consider adding eggs, fish, or legumes."
   ```

3. **Fiber Improvement**

   ```
   "Increase fiber with more vegetables and whole grains."
   ```

4. **Budget Optimization**

   ```
   "Replace expensive items with cost-effective alternatives like lentils and seasonal vegetables."
   ```

5. **Meal Variety**
   ```
   "Your inventory is repetitive. Add different vegetables for better meal diversity."
   ```

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

1. **Prefer inventory items** - Prioritizes foods you already have
2. **Provide smart suggestions** - Recommends missing items for better nutrition
3. **Meet nutritional goals** - Tries to match your targets closely
4. **Create balanced meals** - Ensures variety and nutritional balance
5. **Realistic portions** - Uses appropriate serving sizes
6. **Budget awareness** - Stays within budget constraints
7. **Return valid JSON** - Structured data for easy parsing
8. **Auto-save** - Meal plan is automatically saved to user's account
9. **One plan per user** - New generations replace the previous plan

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

Ensure your goals are achievable with your inventory. If you have limited protein sources but want 200g protein/day, the AI will provide suggestions for improving your inventory.

### 4. Act on AI Suggestions

When the AI provides suggestions:

- ✅ Review recommended items
- ✅ Add missing items to shopping list
- ✅ Update inventory with new items
- ✅ Regenerate meal plan for better results

**Example Workflow:**

```javascript
// 1. Generate meal plan
const plan = await generateMealPlan({ budget: 500 });

// 2. Check suggestions
if (plan.suggestions) {
  console.log("AI suggests:", plan.suggestions);

  // 3. Add suggested items to inventory
  await addToInventory(["spinach", "oranges", "eggs"]);

  // 4. Regenerate with improved inventory
  const improvedPlan = await generateMealPlan({ budget: 500 });
  console.log("Improved plan generated!");
}
```

---

**Your AI Meal Plan Generator is ready! Generate personalized, goal-aligned meal plans instantly! 🍽️🤖✨**
