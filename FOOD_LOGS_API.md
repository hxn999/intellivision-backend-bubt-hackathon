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

Get food logs for 7 consecutive days starting from a specific date.

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
        "calories": 389,
        "protein": 16.9,
        "carbohydrate": 66.3,
        "fat_total": 6.9,
        "fiber": 10.6,
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
      "date": "2024-11-16",
      "dayOfWeek": "Saturday",
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
    // ... continues for 7 days total
  ]
}
```

**Behavior:**

- Returns data for **exactly 7 consecutive days** starting from `startDate`
- Includes day of the week name (Sunday, Monday, etc.)
- Days with no food logs will have empty `logs` array and zero `summary` values
- Food items are fully populated with all nutritional data
- Summary calculates total nutrition for that specific day

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

#### Weekly Food Logs

```javascript
const getWeeklyLogs = async (startDate) => {
  const response = await fetch("http://localhost:3000/analytics/weekly", {
    method: "POST",
    credentials: "include",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ startDate }),
  });

  const data = await response.json();

  // Process weekly logs
  data.dailyLogs.forEach((day) => {
    console.log(`${day.dayOfWeek} - ${day.date}`);
    console.log(`Calories: ${day.summary.calories}`);
    console.log(`Protein: ${day.summary.protein}g`);
    console.log("---");
  });

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

### 2. Weekly Progress Review

Review week's progress for accountability:

```javascript
const data = await getWeeklyLogs("2024-11-15");

// Display weekly summary
const weeklyTotal = data.dailyLogs.reduce(
  (sum, day) => sum + day.summary.calories,
  0
);
const weeklyAvg = weeklyTotal / 7;

console.log(`Weekly Total: ${weeklyTotal} calories`);
console.log(`Daily Average: ${weeklyAvg.toFixed(0)} calories`);

// Find best and worst days
const sorted = [...data.dailyLogs].sort(
  (a, b) => b.summary.calories - a.summary.calories
);
console.log(`Highest: ${sorted[0].dayOfWeek} - ${sorted[0].summary.calories}`);
console.log(`Lowest: ${sorted[6].dayOfWeek} - ${sorted[6].summary.calories}`);
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

| Feature             | Single Day  | Weekly      | Monthly     |
| ------------------- | ----------- | ----------- | ----------- |
| Endpoint            | GET         | POST        | POST        |
| Days returned       | 1           | 7           | 28-31       |
| Includes percentage | ✅ Yes      | ❌ No       | ❌ No       |
| Includes goals      | ✅ Yes      | ❌ No       | ❌ No       |
| Day of week         | ❌ No       | ✅ Yes      | ❌ No       |
| Use case            | Daily check | Week review | Month stats |

---

**Your monthly and weekly food logs endpoints are ready! Perfect for building comprehensive nutrition tracking dashboards! 📊🎉**

