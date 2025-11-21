# Food Logs API Documentation

## Overview

API endpoints to retrieve food logs data organized by day, week, or month with nutritional summaries.

---

## Endpoints

### 1. POST `/analytics/monthly`

Get all food logs for a specific month, separated by each day.

**Authentication:** Required

**Request Body:**

```json
{
  "year": 2024,
  "month": 11
}
```

**Validation:**

- `year`: integer, min 2000, max 2100, required
- `month`: integer, min 1 (January), max 12 (December), required

**Response:** `200 OK`

```json
{
  "message": "Monthly food logs",
  "year": 2024,
  "month": 11,
  "dailyLogs": [
    {
      "date": "2024-11-01",
      "logs": [
        {
          "foodItem": {
            "_id": "65abc...",
            "name": "Chicken Breast",
            "calories": 165,
            "protein": 31,
            "carbohydrate": 0,
            "fat_total": 3.6,
            "serving_quantity": 100,
            "serving_unit": "g"
          },
          "quantity": 2,
          "date": "2024-11-01T12:30:00.000Z"
        }
      ],
      "summary": {
        "calories": 330,
        "protein": 62,
        "carbohydrate": 0,
        "fat_total": 7.2,
        "fiber": 0,
        "sodium": 0,
        "cholesterol": 0,
        "potassium": 0,
        "vitamin_a": 0,
        "vitamin_c": 0,
        "vitamin_d": 0,
        "calcium": 0,
        "iron": 0,
        "magnesium": 0
      }
    },
    {
      "date": "2024-11-02",
      "logs": [],
      "summary": {
        "calories": 0,
        "protein": 0,
        "carbohydrate": 0,
        "fat_total": 0,
        "fiber": 0,
        "sodium": 0,
        "cholesterol": 0,
        "potassium": 0,
        "vitamin_a": 0,
        "vitamin_c": 0,
        "vitamin_d": 0,
        "calcium": 0,
        "iron": 0,
        "magnesium": 0
      }
    }
    // ... continues for all days in the month (28-31 days)
  ]
}
```

**Behavior:**

- Returns data for **every day** in the specified month (28-31 days depending on month)
- Days with no food logs will have empty `logs` array and zero `summary` values
- Food items are fully populated with all nutritional data
- Summary calculates total nutrition for that specific day
- All nutritional values are calculated based on quantity consumed

**Example:**

```bash
curl -X POST http://localhost:3000/analytics/monthly \
  -H "Cookie: access_token=YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"year": 2024, "month": 11}'
```

---

### 2. POST `/analytics/weekly`

Get food logs for 7 consecutive days with AI-generated insights and suggestions.

**Authentication:** Required

**Request Body:**

```json
{
  "startDate": "2024-11-15"
}
```

**Validation:**

- `startDate`: date (string or Date object), required

**Response:** `200 OK`

```json
{
  "message": "Weekly food logs",
  "startDate": "2024-11-15",
  "endDate": "2024-11-21",
  "currentGoal": {
    "calories": 2000,
    "protein": 150,
    "carbohydrate": 200,
    "fat_total": 60,
    "fiber": 30
  },
  "dailyLogs": [
    {
      "date": "2024-11-15",
      "dayOfWeek": "Friday",
      "logs": [
        {
          "foodItem": {
            "_id": "65abc...",
            "name": "Oatmeal",
            "calories": 389,
            "protein": 16.9,
            "carbohydrate": 66.3,
            "fat_total": 6.9,
            "fiber": 10.6,
            "serving_quantity": 100,
            "serving_unit": "g"
          },
          "quantity": 1,
          "date": "2024-11-15T08:00:00.000Z"
        }
      ],
      "summary": {
        "calories": 1850,
        "protein": 145,
        "carbohydrate": 195,
        "fat_total": 58,
        "fiber": 28,
        "sodium": 2100,
        "cholesterol": 150,
        "potassium": 3200,
        "vitamin_a": 850,
        "vitamin_c": 85,
        "vitamin_d": 14,
        "calcium": 950,
        "iron": 16,
        "magnesium": 380
      },
      "result_percentage": {
        "calories": 92.5,
        "protein": 96.7,
        "carbohydrate": 97.5,
        "fat_total": 96.7,
        "fiber": 93.3,
        "sodium": 100,
        "cholesterol": 100,
        "potassium": 91.4,
        "vitamin_a": 94.4,
        "vitamin_c": 94.4,
        "vitamin_d": 93.3,
        "calcium": 95.0,
        "iron": 88.9,
        "magnesium": 95.0
      }
    },
    {
      "date": "2024-11-16",
      "dayOfWeek": "Saturday",
      "logs": [],
      "summary": {
        "calories": 2100,
        "protein": 158,
        "carbohydrate": 210,
        "fat_total": 62,
        "fiber": 31,
        "sodium": 2200,
        "cholesterol": 160,
        "potassium": 3400,
        "vitamin_a": 880,
        "vitamin_c": 88,
        "vitamin_d": 15,
        "calcium": 980,
        "iron": 17,
        "magnesium": 395
      },
      "result_percentage": {
        "calories": 105.0,
        "protein": 105.3,
        "carbohydrate": 105.0,
        "fat_total": 103.3,
        "fiber": 103.3,
        "sodium": 104.8,
        "cholesterol": 106.7,
        "potassium": 97.1,
        "vitamin_a": 97.8,
        "vitamin_c": 97.8,
        "vitamin_d": 100.0,
        "calcium": 98.0,
        "iron": 94.4,
        "magnesium": 98.8
      }
    }
    // ... continues for 7 days total
  ],
  "weeklyTotals": {
    "calories": 13580,
    "protein": 1050,
    "carbohydrate": 1395,
    "fat_total": 415,
    "fiber": 205,
    "sodium": 14700,
    "cholesterol": 1050,
    "potassium": 22400,
    "vitamin_a": 5950,
    "vitamin_c": 595,
    "vitamin_d": 98,
    "calcium": 6650,
    "iron": 112,
    "magnesium": 2660
  },
  "weeklyAverages": {
    "calories": 1940,
    "protein": 150,
    "carbohydrate": 199.3,
    "fat_total": 59.3,
    "fiber": 29.3,
    "sodium": 2100,
    "cholesterol": 150,
    "potassium": 3200,
    "vitamin_a": 850,
    "vitamin_c": 85,
    "vitamin_d": 14,
    "calcium": 950,
    "iron": 16,
    "magnesium": 380
  },
  "weeklyAveragePercentages": {
    "calories": 97.0,
    "protein": 100.0,
    "carbohydrate": 99.7,
    "fat_total": 98.8,
    "fiber": 97.7,
    "sodium": 100.0,
    "cholesterol": 100.0,
    "potassium": 91.4,
    "vitamin_a": 94.4,
    "vitamin_c": 94.4,
    "vitamin_d": 93.3,
    "calcium": 95.0,
    "iron": 88.9,
    "magnesium": 95.0
  },
  "aiSuggestions": "## Weekly Nutrition Analysis\n\n### 1. General Consumption Trend\n\n**Overall Pattern**: Your weekly consumption shows good consistency with an average of 1940 kcal per day (97% of your goal). You're maintaining steady intake throughout the week with only minor variations.\n\n**What to Improve**:\n- Increase calorie intake slightly to meet your 2000 kcal target more consistently\n- Aim for more uniform daily intake to avoid under-eating days\n\n### 2. Over/Under Consumption Detection\n\n**Under-consuming**:\n- ⚠️ **Iron** (88.9% of goal): Consistently below target. Add more red meat, spinach, or fortified cereals\n- ⚠️ **Vitamin D** (93.3% of goal): Slightly low. Consider fatty fish, egg yolks, or supplementation\n- ⚠️ **Vitamin C** (94.4% of goal): Add more citrus fruits, bell peppers, or tomatoes\n\n**Well-balanced**:\n- ✅ **Protein** (100% of goal): Excellent protein intake\n- ✅ **Carbohydrates** (99.7% of goal): Nearly perfect\n- ✅ **Fiber** (97.7% of goal): Good fiber intake\n\n### 3. Nutritional Imbalances & Suggestions\n\n**Macro Balance**: Your macronutrient ratios are well-balanced with no major concerns. Protein-to-carb ratio is healthy.\n\n**Key Recommendations**:\n\n1. **Boost Iron Intake**: \n   - Add 1-2 servings of red meat or dark leafy greens per week\n   - Pair iron-rich foods with vitamin C for better absorption\n\n2. **Improve Micronutrient Variety**:\n   - Include more colorful vegetables for better vitamin coverage\n   - Consider a vitamin D supplement, especially if sun exposure is limited\n\n3. **Maintain Current Habits**:\n   - Your protein and fiber intake are excellent - keep it up!\n   - Calorie consistency is good, just slightly increase portion sizes\n\n**Action Items for Next Week**:\n- Add spinach or kale to 2-3 meals\n- Include citrus fruit daily (oranges, grapefruit)\n- Consider fortified foods or supplements for vitamin D\n- Increase portion sizes slightly to reach 2000 kcal target"
}
```

**Behavior:**

- Returns data for **exactly 7 consecutive days** starting from `startDate`
- Includes day of the week name (Sunday, Monday, etc.)
- Calculates **result percentages** for each day based on user's goal
- Computes **weekly totals** and **weekly averages**
- Generates **AI-powered suggestions** analyzing consumption trends
- Days with no food logs will have empty `logs` array and zero `summary` values
- Food items are fully populated with all nutritional data
- Summary calculates total nutrition for that specific day

**AI Suggestions Include:**

1. **General Consumption Trend**: Overall patterns and consistency analysis
2. **Over/Under Consumption**: Specific nutrients above or below targets
3. **Nutritional Imbalances**: Macro/micro nutrient ratio issues with actionable suggestions

**Example:**

```bash
curl -X POST http://localhost:3000/analytics/weekly \
  -H "Cookie: access_token=YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"startDate": "2024-11-15"}'
```

---

## Data Structure

### Daily Log Object

```typescript
interface DailyLog {
  date: string; // ISO date string (YYYY-MM-DD)
  dayOfWeek?: string; // Only in weekly endpoint
  logs: FoodLogEntry[]; // Array of food log entries
  summary: NutritionalSummary; // Total nutrition for the day
}
```

### Nutritional Summary

```typescript
interface NutritionalSummary {
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
```

### Food Log Entry

```typescript
interface FoodLogEntry {
  foodItem: {
    _id: string;
    name: string;
    calories: number;
    protein: number;
    carbohydrate: number;
    fat_total: number;
    fiber?: number;
    sodium?: number;
    cholesterol?: number;
    potassium?: number;
    vitamin_a?: number;
    vitamin_c?: number;
    vitamin_d?: number;
    calcium?: number;
    iron?: number;
    magnesium?: number;
    serving_quantity: number;
    serving_unit: string;
    // ... other food item fields
  };
  quantity: number; // Number of servings consumed
  date: Date; // When the food was logged
}
```

---

## Calculation Logic

### Nutritional Values Calculation

```typescript
// For each food log entry:
const consumedFactor = (quantity * serving_quantity) / 100;

// Then multiply each nutritional value:
totalCalories += consumedFactor * foodItem.calories;
totalProtein += consumedFactor * foodItem.protein;
// ... etc
```

**Example:**

```
Food: Chicken Breast
- Serving: 100g
- Calories per 100g: 165
- Quantity consumed: 2 servings

Calculation:
consumedFactor = (2 * 100) / 100 = 2
totalCalories = 2 * 165 = 330 calories
```

---

## Usage Examples

### JavaScript/Fetch

#### Monthly Food Logs

```javascript
const getMonthlyLogs = async (year, month) => {
  const response = await fetch("http://localhost:3000/analytics/monthly", {
    method: "POST",
    credentials: "include",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ year, month }),
  });

  const data = await response.json();

  // Process daily logs
  data.dailyLogs.forEach((day) => {
    console.log(`Date: ${day.date}`);
    console.log(`Total Calories: ${day.summary.calories}`);
    console.log(`Number of meals: ${day.logs.length}`);
    console.log("---");
  });

  return data;
};

// Get November 2024 logs
await getMonthlyLogs(2024, 11);
```

#### Weekly Food Logs with AI Insights

```javascript
const getWeeklyLogs = async (startDate) => {
  const response = await fetch("http://localhost:3000/analytics/weekly", {
    method: "POST",
    credentials: "include",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ startDate }),
  });

  const data = await response.json();

  // Display weekly summary
  console.log("=== Weekly Summary ===");
  console.log(`Average Calories: ${data.weeklyAverages.calories.toFixed(0)} kcal`);
  console.log(`Average Protein: ${data.weeklyAverages.protein.toFixed(1)}g`);
  console.log("");

  // Display daily breakdown
  console.log("=== Daily Breakdown ===");
  data.dailyLogs.forEach((day) => {
    console.log(`${day.dayOfWeek} (${day.date}):`);
    console.log(`  Calories: ${day.summary.calories.toFixed(0)} (${day.result_percentage.calories.toFixed(1)}%)`);
    console.log(`  Protein: ${day.summary.protein.toFixed(1)}g (${day.result_percentage.protein.toFixed(1)}%)`);
  });
  console.log("");

  // Display AI suggestions
  if (data.aiSuggestions) {
    console.log("=== AI Nutritionist Insights ===");
    console.log(data.aiSuggestions);
  }

  return data;
};

// Get week starting November 15, 2024
await getWeeklyLogs("2024-11-15");
```

---

## Use Cases

### 1. Monthly Nutrition Tracking

Track entire month's nutrition to identify patterns:

```javascript
const data = await getMonthlyLogs(2024, 11);

// Find days over calorie goal
const highCalorieDays = data.dailyLogs.filter(
  (day) => day.summary.calories > 2000
);

// Calculate average daily calories
const avgCalories =
  data.dailyLogs.reduce((sum, day) => sum + day.summary.calories, 0) /
  data.dailyLogs.length;

console.log(`Average daily calories: ${avgCalories.toFixed(0)}`);
```

### 2. Weekly Progress Review with AI Guidance

Review week's progress with personalized AI insights:

```javascript
const data = await getWeeklyLogs("2024-11-15");

// Display weekly summary with percentages
console.log(`Weekly Average Calories: ${data.weeklyAverages.calories.toFixed(0)} (${data.weeklyAveragePercentages.calories.toFixed(1)}% of goal)`);
console.log(`Weekly Average Protein: ${data.weeklyAverages.protein.toFixed(1)}g (${data.weeklyAveragePercentages.protein.toFixed(1)}% of goal)`);

// Identify problem areas
const underConsuming = [];
const overConsuming = [];

for (const [nutrient, percentage] of Object.entries(data.weeklyAveragePercentages)) {
  if (percentage < 90) {
    underConsuming.push({ nutrient, percentage });
  } else if (percentage > 110) {
    overConsuming.push({ nutrient, percentage });
  }
}

console.log("\nNutrients to Increase:", underConsuming);
console.log("Nutrients to Reduce:", overConsuming);

// Display AI suggestions (markdown format)
if (data.aiSuggestions) {
  console.log("\n📊 AI Nutritionist Analysis:\n");
  console.log(data.aiSuggestions);
}
```

### 3. Building Charts/Graphs

Perfect for data visualization:

```javascript
// Monthly chart data
const monthlyData = await getMonthlyLogs(2024, 11);
const chartData = monthlyData.dailyLogs.map((day) => ({
  x: day.date,
  calories: day.summary.calories,
  protein: day.summary.protein,
  carbs: day.summary.carbohydrate,
  fats: day.summary.fat_total,
}));

// Use with Chart.js, Recharts, etc.
```

### 4. Consistency Tracking

Check how many days user logged food:

```javascript
const data = await getMonthlyLogs(2024, 11);

const daysLogged = data.dailyLogs.filter((day) => day.logs.length > 0).length;
const totalDays = data.dailyLogs.length;

console.log(`Logged ${daysLogged} out of ${totalDays} days`);
console.log(`Consistency: ${((daysLogged / totalDays) * 100).toFixed(1)}%`);
```

---

## Response Sizes

### Monthly Endpoint

- **Days returned:** 28-31 (full month)
- **Typical response:** Medium to large (depends on food logs per day)
- **Empty month:** ~15KB (just structure)
- **Full month:** Can be 100KB+ with many logs

### Weekly Endpoint

- **Days returned:** Exactly 7
- **Typical response:** Small to medium
- **Empty week:** ~5KB
- **Full week:** 20-50KB

---

## Performance Notes

### Optimization Tips

1. **Pagination not needed** - Data is already separated by day
2. **Caching recommended** - Cache monthly data as it rarely changes
3. **Selective loading** - Use weekly for recent data, monthly for history
4. **Frontend optimization** - Lazy load detailed logs, show summaries first

### Query Performance

- Both endpoints use single DB query with population
- Performance scales with total user food logs, not date range
- Recommended to add indexes on `foodLogs.date` if needed

---

## Error Responses

### 401 Unauthorized

```json
{
  "message": "Unauthorized"
}
```

**Cause:** No valid authentication token

### 404 Not Found

```json
{
  "message": "User not found"
}
```

**Cause:** User ID in token doesn't exist

### 400 Bad Request

```json
{
  "message": "Validation error",
  "errors": [
    {
      "path": "month",
      "message": "Number must be less than or equal to 12"
    }
  ]
}
```

**Cause:** Invalid input data (year/month/date out of range)

### 500 Internal Server Error

```json
{
  "message": "Internal server error"
}
```

**Cause:** Server error, check logs

---

## Best Practices

### 1. Date Handling

```javascript
// Always use ISO date strings for consistency
const startDate = new Date("2024-11-15").toISOString();

// For monthly, use integers
const month = 11; // November (not zero-indexed)
const year = 2024;
```

### 2. Empty Days

```javascript
// Always check if logs exist before processing
data.dailyLogs.forEach((day) => {
  if (day.logs.length > 0) {
    // Process day with logs
  } else {
    // Handle empty day (show "No logs" message)
  }
});
```

### 3. Client-Side Caching

```javascript
// Cache monthly data (doesn't change often)
const cacheKey = `monthly_${year}_${month}`;
const cached = localStorage.getItem(cacheKey);

if (cached && isToday) {
  return JSON.parse(cached);
} else {
  const fresh = await getMonthlyLogs(year, month);
  localStorage.setItem(cacheKey, JSON.stringify(fresh));
  return fresh;
}
```

---

## Comparison with Single Day Analytics

| Feature             | Single Day  | Weekly          | Monthly     |
| ------------------- | ----------- | --------------- | ----------- |
| Endpoint            | GET         | POST            | POST        |
| Days returned       | 1           | 7               | 28-31       |
| Includes percentage | ✅ Yes      | ✅ Yes (Daily)  | ❌ No       |
| Includes goals      | ✅ Yes      | ✅ Yes          | ❌ No       |
| Weekly averages     | ❌ No       | ✅ Yes          | ❌ No       |
| AI suggestions      | ❌ No       | ✅ Yes          | ❌ No       |
| Day of week         | ❌ No       | ✅ Yes          | ❌ No       |
| Use case            | Daily check | Week analysis   | Month stats |

---

**Your monthly and weekly food logs endpoints are ready! Perfect for building comprehensive nutrition tracking dashboards! 📊🎉**

