# Food Expiration Check API

## Overview

Monitor your food inventory for expiration and waste. This endpoint automatically checks all food items in your inventory and categorizes them based on their expiration status.

---

## Endpoint

### GET `/inventory/expiration-check`

Check expiration status of all food items in your inventory.

**Authentication:** Required

**Request Body:** None

**Response:** `200 OK`

```json
{
  "message": "Inventory expiration check completed",
  "inventoryCreatedAt": "2024-11-15T10:00:00.000Z",
  "totalItems": 15,
  "warning": [
    {
      "foodItem": {
        "_id": "65abc123def456...",
        "name": "Fresh Milk",
        "image_url": "https://...",
        "expiration_hours": 168
      },
      "createdAt": "2024-11-15T10:00:00.000Z",
      "hoursElapsed": 140.5,
      "hoursRemaining": 27.5,
      "percentageRemaining": 16.37,
      "status": "warning"
    },
    {
      "foodItem": {
        "_id": "65def789ghi012...",
        "name": "Lettuce",
        "image_url": "https://...",
        "expiration_hours": 120
      },
      "createdAt": "2024-11-15T10:00:00.000Z",
      "hoursElapsed": 95.2,
      "hoursRemaining": 24.8,
      "percentageRemaining": 20.67,
      "status": "warning"
    }
  ],
  "wasted": [
    {
      "foodItem": {
        "_id": "65ghi345jkl678...",
        "name": "Strawberries",
        "image_url": "https://...",
        "expiration_hours": 72
      },
      "createdAt": "2024-11-15T10:00:00.000Z",
      "hoursElapsed": 150.3,
      "hoursRemaining": -78.3,
      "percentageRemaining": -108.75,
      "status": "wasted"
    }
  ],
  "summary": {
    "warningCount": 2,
    "wastedCount": 1,
    "healthyCount": 12
  }
}
```

**Status Codes:**

- `200 OK`: Check completed successfully (even if inventory is empty)
- `400 Bad Request`: No inventory found
- `401 Unauthorized`: Not authenticated
- `404 Not Found`: User not found
- `500 Internal Server Error`: Server error

---

## How It Works

### Expiration Calculation

For each food item in your inventory:

1. **Calculate Time Elapsed:**
   ```
   hoursElapsed = (current time - inventory creation time) / hours
   ```

2. **Calculate Time Remaining:**
   ```
   hoursRemaining = expiration_hours - hoursElapsed
   ```

3. **Calculate Percentage:**
   ```
   percentageRemaining = (hoursRemaining / expiration_hours) × 100
   ```

4. **Categorize:**
   - **Wasted:** `hoursRemaining ≤ 0` (expired)
   - **Warning:** `0 < hoursRemaining` AND `percentageRemaining ≤ 40%`
   - **Healthy:** `percentageRemaining > 40%`

### Example Calculation

```
Food Item: Fresh Milk
Expiration Hours: 168 hours (7 days)
Inventory Created: Nov 15, 10:00 AM
Current Time: Nov 21, 6:30 PM

Hours Elapsed: 140.5 hours
Hours Remaining: 168 - 140.5 = 27.5 hours
Percentage Remaining: (27.5 / 168) × 100 = 16.37%

Status: WARNING (16.37% < 40%)
```

---

## Response Structure

### Expiration Item Object

```typescript
interface ExpirationItem {
  foodItem: {
    _id: string;
    name: string;
    image_url?: string;
    expiration_hours: number;
  };
  createdAt: Date; // When inventory was created
  hoursElapsed: number; // Time passed since creation
  hoursRemaining: number; // Time left before expiration (negative if expired)
  percentageRemaining: number; // % of shelf life remaining
  status: "warning" | "wasted";
}
```

### Summary Object

```typescript
interface Summary {
  warningCount: number; // Items with ≤40% time remaining
  wastedCount: number; // Items that have expired
  healthyCount: number; // Items with >40% time remaining
}
```

---

## Use Cases

### 1. Check Expiration Status

```javascript
const checkExpiration = async () => {
  const response = await fetch("http://localhost:3000/inventory/expiration-check", {
    credentials: "include",
  });

  const data = await response.json();

  console.log(`Total Items: ${data.totalItems}`);
  console.log(`Warning: ${data.summary.warningCount}`);
  console.log(`Wasted: ${data.summary.wastedCount}`);
  console.log(`Healthy: ${data.summary.healthyCount}`);
};
```

### 2. Display Warning Notifications

```javascript
const showWarnings = async () => {
  const response = await fetch("http://localhost:3000/inventory/expiration-check", {
    credentials: "include",
  });

  const { warning } = await response.json();

  if (warning.length > 0) {
    console.log("⚠️ Foods expiring soon:");
    warning.forEach((item) => {
      console.log(
        `- ${item.foodItem.name}: ${item.hoursRemaining.toFixed(1)} hours left (${item.percentageRemaining.toFixed(1)}%)`
      );
    });
  } else {
    console.log("✅ All food items are fresh!");
  }
};
```

### 3. List Wasted Food

```javascript
const showWasted = async () => {
  const response = await fetch("http://localhost:3000/inventory/expiration-check", {
    credentials: "include",
  });

  const { wasted } = await response.json();

  if (wasted.length > 0) {
    console.log("❌ Expired foods:");
    wasted.forEach((item) => {
      const daysExpired = Math.abs(item.hoursRemaining / 24).toFixed(1);
      console.log(`- ${item.foodItem.name}: expired ${daysExpired} days ago`);
    });

    // Suggest removing wasted items
    console.log("\nConsider removing these items from your inventory.");
  }
};
```

### 4. Priority Sorting

```javascript
const getMostUrgent = async () => {
  const response = await fetch("http://localhost:3000/inventory/expiration-check", {
    credentials: "include",
  });

  const { warning } = await response.json();

  // Items are already sorted by hoursRemaining (lowest first)
  const mostUrgent = warning[0];

  if (mostUrgent) {
    console.log("⚠️ Most Urgent Item:");
    console.log(`${mostUrgent.foodItem.name}`);
    console.log(`Time Left: ${mostUrgent.hoursRemaining.toFixed(1)} hours`);
    console.log(`${mostUrgent.percentageRemaining.toFixed(1)}% of shelf life remaining`);
  }
};
```

### 5. Auto-Remove Wasted Items

```javascript
const cleanupWasted = async () => {
  const checkResponse = await fetch("http://localhost:3000/inventory/expiration-check", {
    credentials: "include",
  });

  const { wasted } = await checkResponse.json();

  // Remove all wasted items
  for (const item of wasted) {
    await fetch(`http://localhost:3000/inventory/items/${item.foodItem._id}`, {
      method: "DELETE",
      credentials: "include",
    });
    console.log(`Removed: ${item.foodItem.name}`);
  }

  console.log(`Cleaned up ${wasted.length} expired items`);
};
```

### 6. Dashboard Widget

```javascript
const getDashboardData = async () => {
  const response = await fetch("http://localhost:3000/inventory/expiration-check", {
    credentials: "include",
  });

  const data = await response.json();

  return {
    totalItems: data.totalItems,
    healthyPercentage: ((data.summary.healthyCount / data.totalItems) * 100).toFixed(1),
    warningCount: data.summary.warningCount,
    wastedCount: data.summary.wastedCount,
    urgentItems: data.warning.slice(0, 3), // Top 3 most urgent
  };
};
```

---

## Visual Indicators

### Color Coding

```javascript
const getStatusColor = (percentageRemaining) => {
  if (percentageRemaining <= 0) return "red"; // Wasted
  if (percentageRemaining <= 40) return "orange"; // Warning
  return "green"; // Healthy
};
```

### Progress Bars

```javascript
const renderProgressBar = (item) => {
  const percentage = Math.max(0, item.percentageRemaining);
  return `
    <div class="progress-bar">
      <div class="fill" style="width: ${percentage}%"></div>
    </div>
    <span>${item.hoursRemaining.toFixed(1)}h remaining</span>
  `;
};
```

### Icons

```javascript
const getStatusIcon = (status) => {
  return status === "wasted" ? "🗑️" : "⚠️";
};
```

---

## Response Examples

### Empty Inventory

```json
{
  "message": "Inventory is empty",
  "warning": [],
  "wasted": []
}
```

### All Items Healthy

```json
{
  "message": "Inventory expiration check completed",
  "inventoryCreatedAt": "2024-11-20T10:00:00.000Z",
  "totalItems": 10,
  "warning": [],
  "wasted": [],
  "summary": {
    "warningCount": 0,
    "wastedCount": 0,
    "healthyCount": 10
  }
}
```

### Mixed Status

```json
{
  "message": "Inventory expiration check completed",
  "inventoryCreatedAt": "2024-11-15T10:00:00.000Z",
  "totalItems": 20,
  "warning": [
    /* 5 items with ≤40% time remaining */
  ],
  "wasted": [
    /* 2 expired items */
  ],
  "summary": {
    "warningCount": 5,
    "wastedCount": 2,
    "healthyCount": 13
  }
}
```

---

## Best Practices

### 1. Regular Checks

```javascript
// Check expiration daily
const dailyCheck = async () => {
  const data = await fetch("http://localhost:3000/inventory/expiration-check", {
    credentials: "include",
  }).then((r) => r.json());

  // Send notifications if items need attention
  if (data.warning.length > 0 || data.wasted.length > 0) {
    sendNotification({
      title: "Food Expiration Alert",
      message: `${data.warning.length} items expiring soon, ${data.wasted.length} expired`,
    });
  }
};

// Run daily
setInterval(dailyCheck, 24 * 60 * 60 * 1000);
```

### 2. Prioritize Consumption

```javascript
// Create meal suggestions based on expiring items
const suggestMeals = async () => {
  const { warning } = await fetch("http://localhost:3000/inventory/expiration-check", {
    credentials: "include",
  }).then((r) => r.json());

  // Use items with least time remaining in meal plans
  const expiringIngredients = warning.slice(0, 5).map((w) => w.foodItem.name);

  console.log("Suggested ingredients for today's meals:", expiringIngredients);
};
```

### 3. Waste Tracking

```javascript
// Track waste over time
const trackWaste = async () => {
  const { wasted } = await fetch("http://localhost:3000/inventory/expiration-check", {
    credentials: "include",
  }).then((r) => r.json());

  // Log waste statistics
  const wasteLog = {
    date: new Date(),
    itemsWasted: wasted.length,
    items: wasted.map((w) => w.foodItem.name),
  };

  // Store in analytics
  await saveWasteLog(wasteLog);
};
```

### 4. Smart Shopping

```javascript
// Adjust shopping based on expiration patterns
const getShoppingInsights = async () => {
  const { warning, wasted } = await fetch("http://localhost:3000/inventory/expiration-check", {
    credentials: "include",
  }).then((r) => r.json());

  const frequentlyWasted = wasted.map((w) => w.foodItem.name);

  return {
    avoidBuying: frequentlyWasted,
    buyLess: warning.map((w) => w.foodItem.name),
  };
};
```

---

## Integration with Other Features

### Meal Planning

```javascript
// Generate meal plan using items that need to be consumed soon
const generateUrgentMealPlan = async () => {
  const { warning } = await fetch("http://localhost:3000/inventory/expiration-check", {
    credentials: "include",
  }).then((r) => r.json());

  const urgentItems = warning
    .slice(0, 5)
    .map((w) => w.foodItem.name)
    .join(", ");

  // Use in meal plan generation preferences
  const mealPlan = await fetch("http://localhost:3000/user/generate-meal-plan", {
    method: "POST",
    credentials: "include",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      preferences: `Prioritize using these ingredients: ${urgentItems}`,
      mealCount: 3,
    }),
  });

  return mealPlan.json();
};
```

### Inventory Management

```javascript
// Complete workflow
const manageInventory = async () => {
  // 1. Check expiration
  const expiration = await fetch("http://localhost:3000/inventory/expiration-check", {
    credentials: "include",
  }).then((r) => r.json());

  // 2. Remove wasted items
  for (const item of expiration.wasted) {
    await fetch(`http://localhost:3000/inventory/items/${item.foodItem._id}`, {
      method: "DELETE",
      credentials: "include",
    });
  }

  // 3. Notify about warnings
  if (expiration.warning.length > 0) {
    console.log(`⚠️ ${expiration.warning.length} items expiring soon!`);
  }

  // 4. Get fresh inventory
  const inventory = await fetch("http://localhost:3000/inventory", {
    credentials: "include",
  }).then((r) => r.json());

  return inventory;
};
```

---

## Time Calculations

### Convert Hours to Days

```javascript
const hoursToDays = (hours) => {
  return (hours / 24).toFixed(1);
};

// Example: 27.5 hours = 1.1 days
```

### Format Time Remaining

```javascript
const formatTimeRemaining = (hours) => {
  if (hours < 0) {
    const daysExpired = Math.abs(hours / 24).toFixed(1);
    return `Expired ${daysExpired} days ago`;
  }

  if (hours < 24) {
    return `${hours.toFixed(1)} hours left`;
  }

  const days = Math.floor(hours / 24);
  const remainingHours = Math.round(hours % 24);
  return `${days} days, ${remainingHours} hours left`;
};
```

### Get Urgency Level

```javascript
const getUrgencyLevel = (percentageRemaining) => {
  if (percentageRemaining <= 0) return "expired";
  if (percentageRemaining <= 20) return "critical";
  if (percentageRemaining <= 40) return "warning";
  return "healthy";
};
```

---

## Performance Notes

- **Response Time:** Fast (< 100ms for typical inventories)
- **No Database Writes:** Read-only operation
- **Calculation:** Done in-memory on server
- **Sorting:** Results sorted by urgency (most urgent first)

---

## Error Handling

### No Inventory

```json
{
  "message": "No inventory found. Please create an inventory first."
}
```

**Solution:** Inventory is created automatically during registration.

### Empty Inventory

```json
{
  "message": "Inventory is empty",
  "warning": [],
  "wasted": []
}
```

**This is normal:** Add food items to populate inventory.

---

## Tips

### 1. Check Regularly

Run expiration checks daily or when opening the app to stay informed.

### 2. Act on Warnings

When items show warning status (≤40%), prioritize using them in meals.

### 3. Clean Up Waste

Remove expired items promptly to maintain accurate inventory.

### 4. Track Patterns

Monitor which items frequently expire to adjust shopping habits.

### 5. Use in Meal Planning

Generate meal plans that prioritize expiring items.

---

**Your Food Expiration Check API is ready! Reduce waste and stay informed about your food freshness! 🥗⏰✅**

