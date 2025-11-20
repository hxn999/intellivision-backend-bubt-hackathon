# Express + TypeScript Backend - Food & Health Tracking API

This is an Express + TypeScript backend with MongoDB/Mongoose, JWT auth, and Zod validation for a comprehensive food and health tracking application.

## Table of Contents

- [Getting Started](#getting-started)
- [Scripts](#scripts)
- [Environment Variables](#environment-variables)
- [MongoDB / Mongoose](#mongodb--mongoose)
- [Production Deployment](#production-deployment)
- [API Documentation](#api-documentation)
  - [Health Check](#health-check)
  - [Authentication](#authentication)
  - [User Management](#user-management)
  - [Food Items](#food-items)
  - [Inventory Management](#inventory-management)
  - [Analytics](#analytics)
- [Using the API](#using-the-api)
- [Error Handling](#error-handling)

---

## Getting Started

1. **Install dependencies**:
   ```bash
   npm install
   ```

2. **Set up environment variables** (see [Environment Variables](#environment-variables))

3. **Start development server**:
   ```bash
   npm run dev
   ```

The server will start on `http://localhost:3000` (or your specified `PORT`).

---

## Scripts

- **Development**: `npm run dev`  
  Starts the server with `ts-node-dev` (auto-reload) on `http://localhost:3000` (default).

- **Build**: `npm run build`  
  Compiles TypeScript from `src` to JavaScript in `dist`.

- **Start (production)**: `npm start`  
  Runs the compiled server from `dist/index.js`.

---

## Environment Variables

Create a `.env` file in the root directory with the following variables:

- **`PORT`**: Port for HTTP server (default `3000` if not set).
- **`MONGODB_URI`**: MongoDB connection string.  
  Defaults to `mongodb://127.0.0.1:27017/hackathon` if not provided.
- **`JWT_SECRET`**: Secret for signing access tokens (required in production).
- **`JWT_REFRESH_SECRET`**: Secret for signing refresh tokens (falls back to `JWT_SECRET` if not set).
- **`NODE_ENV`**: Use `production` in prod to enable secure cookies.
- **`CLOUDINARY_CLOUD_NAME`**: Cloudinary cloud name for image uploads (optional).
- **`CLOUDINARY_API_KEY`**: Cloudinary API key (optional).
- **`CLOUDINARY_API_SECRET`**: Cloudinary API secret (optional).

---

## MongoDB / Mongoose

- Uses **Mongoose** to connect to MongoDB before starting the HTTP server.
- Connection config lives in `src/config/database.ts`.

---

## Production Deployment

### 1. Build the app

```bash
npm install
npm run build
```

### 2. Set environment variables

At minimum set: `MONGODB_URI`, `JWT_SECRET`, `JWT_REFRESH_SECRET`, `NODE_ENV=production`, and optionally `PORT`.

### 3. Run the compiled server

- Direct: `npm start` (runs `node dist/index.js`).
- Or with a process manager (recommended):
  - For example with `pm2`: `pm2 start dist/index.js --name hackathon-backend`.

### 4. Put behind a reverse proxy (optional but recommended)

Use nginx/Traefik/etc. to terminate TLS and forward traffic to `http://localhost:PORT`.

---

## API Documentation

### Base URL

- **Development**: `http://localhost:3000`
- **Production**: Your deployed server URL

All requests and responses use `Content-Type: application/json` unless specified otherwise.

---

### Health Check

#### GET `/health`

Health-check endpoint to verify the server is running.

**Response:**
```json
{
  "status": "ok"
}
```

**Status Codes:**
- `200 OK`: Server is healthy

---

## Authentication

All authentication routes are mounted at `/auth`.

### POST `/auth/register`

Register a new user account.

**Request Body:**
```json
{
  "fullName": "John Doe",
  "email": "john@example.com",
  "password": "password123"
}
```

**Validation:**
- `fullName`: string, min 2 characters, required
- `email`: valid email format, required
- `password`: string, min 6 characters, required

**Response:** `201 Created`
```json
{
  "user": {
    "id": "507f1f77bcf86cd799439011",
    "fullName": "John Doe",
    "email": "john@example.com"
  }
}
```

**Behavior:**
- Hashes password with bcrypt
- Creates user in database
- Issues `access_token` (7 days) and `refresh_token` (30 days) as **httpOnly cookies**

**Status Codes:**
- `201 Created`: User successfully registered
- `400 Bad Request`: Validation error
- `500 Internal Server Error`: Server error

---

### POST `/auth/login`

Login to an existing account.

**Request Body:**
```json
{
  "email": "john@example.com",
  "password": "password123"
}
```

**Validation:**
- `email`: valid email format, required
- `password`: string, min 6 characters, required

**Response:** `200 OK`
```json
{
  "user": {
    "id": "507f1f77bcf86cd799439011",
    "fullName": "John Doe",
    "email": "john@example.com"
  }
}
```

**Behavior:**
- Verifies credentials
- Issues `access_token` and `refresh_token` as httpOnly cookies

**Status Codes:**
- `200 OK`: Login successful
- `401 Unauthorized`: Invalid credentials
- `400 Bad Request`: Validation error

---

### POST `/auth/logout`

Logout and clear authentication cookies.

**Authentication:** Required (via `access_token` cookie)

**Response:** `200 OK`
```json
{
  "message": "Logged out"
}
```

**Behavior:**
- Clears `access_token` and `refresh_token` cookies

**Status Codes:**
- `200 OK`: Logout successful
- `401 Unauthorized`: Not authenticated

---

### POST `/auth/refresh`

Refresh the access token using a refresh token.

**Authentication:** Requires `refresh_token` cookie

**Response:** `200 OK`
```json
{
  "message": "Access token refreshed"
}
```

**Behavior:**
- Reads `refresh_token` cookie
- Verifies refresh token and user
- Issues a new `access_token` httpOnly cookie

**Status Codes:**
- `200 OK`: Token refreshed
- `401 Unauthorized`: Invalid or expired refresh token

---

## User Management

All user routes are mounted at `/user` and require authentication.

### GET `/user/me`

Get the authenticated user's profile information.

**Authentication:** Required

**Response:** `200 OK`
```json
{
  "user": {
    "id": "507f1f77bcf86cd799439011",
    "fullName": "John Doe",
    "email": "john@example.com",
    "healthProfile": { ... },
    "goals": [ ... ],
    "current_goal_index": 0,
    "foodLogs": [ ... ]
  }
}
```

**Status Codes:**
- `200 OK`: User data retrieved
- `401 Unauthorized`: Not authenticated
- `404 Not Found`: User not found

---

### PUT `/user/health-profile`

Create or update the user's health profile.

**Authentication:** Required

**Request Body:**
```json
{
  "birth_date": "1990-01-15",
  "gender": "male",
  "height_cm": 175,
  "current_weight_kg": 75,
  "activity_level_factor": 1.55,
  "body_fat_percentage": 18.5,
  "waist_circumference_cm": 85,
  "hip_circumference_cm": 95,
  "neck_circumference_cm": 38,
  "steps_daily_average": 8000,
  "sleep_hours_average": 7.5,
  "blood_glucose_fasting": 95,
  "hba1c": 5.4,
  "blood_pressure_systolic": 120,
  "blood_pressure_diastolic": 80,
  "cholesterol_ldl": 100,
  "cholesterol_hdl": 55
}
```

**Required Fields:**
- `birth_date`: date
- `gender`: "male" or "female"
- `height_cm`: positive number
- `current_weight_kg`: positive number
- `activity_level_factor`: positive number

**Optional Fields:**
- All body composition and biomarker fields

**Response:** `200 OK`
```json
{
  "user": {
    "id": "507f1f77bcf86cd799439011",
    "fullName": "John Doe",
    "email": "john@example.com",
    "healthProfile": { ... }
  }
}
```

**Status Codes:**
- `200 OK`: Profile updated
- `400 Bad Request`: Validation error
- `401 Unauthorized`: Not authenticated

---

### PATCH `/user/profile`

Update user's basic profile information (name and/or password).

**Authentication:** Required

**Request Body:**
```json
{
  "fullName": "John Smith",
  "currentPassword": "oldpassword",
  "newPassword": "newpassword123"
}
```

**Validation:**
- At least one of `fullName` or `newPassword` must be provided
- `fullName`: string, min 2 characters (optional)
- `currentPassword`: required if `newPassword` is provided
- `newPassword`: string, min 6 characters (optional)

**Response:** `200 OK`
```json
{
  "user": {
    "id": "507f1f77bcf86cd799439011",
    "fullName": "John Smith",
    "email": "john@example.com"
  }
}
```

**Status Codes:**
- `200 OK`: Profile updated
- `400 Bad Request`: Validation error
- `401 Unauthorized`: Current password incorrect or not authenticated

---

### PATCH `/user/profile-image`

Upload or update user's profile image.

**Authentication:** Required

**Content-Type:** `multipart/form-data`

**Request Body (Form Data):**
- `image`: Image file (JPEG, PNG, etc.)

**Response:** `200 OK`
```json
{
  "message": "Profile image uploaded successfully",
  "imageUrl": "https://res.cloudinary.com/..."
}
```

**Status Codes:**
- `200 OK`: Image uploaded
- `400 Bad Request`: No image provided or invalid format
- `401 Unauthorized`: Not authenticated

---

### POST `/user/food-logs`

Add a food log entry to track consumed food.

**Authentication:** Required

**Request Body:**
```json
{
  "date": "2024-01-15",
  "time": "08:30",
  "foodItemId": "507f1f77bcf86cd799439011",
  "quantity": 1.5
}
```

**Validation:**
- `date`: date format, required
- `time`: string (e.g., "08:30"), required
- `foodItemId`: valid FoodItem ObjectId, required
- `quantity`: positive number, required

**Response:** `201 Created`
```json
{
  "foodLogs": [
    {
      "date": "2024-01-15T00:00:00.000Z",
      "time": "08:30",
      "foodItem": "507f1f77bcf86cd799439011",
      "quantity": 1.5
    }
  ]
}
```

**Status Codes:**
- `201 Created`: Food log added
- `400 Bad Request`: Validation error
- `401 Unauthorized`: Not authenticated

---

### DELETE `/user/food-logs/:index`

Delete a food log entry by index.

**Authentication:** Required

**URL Parameters:**
- `index`: 0-based index into the `foodLogs` array

**Example:** `DELETE /user/food-logs/2`

**Response:** `200 OK`
```json
{
  "deleted": {
    "date": "2024-01-15T00:00:00.000Z",
    "time": "08:30",
    "foodItem": "507f1f77bcf86cd799439011",
    "quantity": 1.5
  },
  "foodLogs": [ ... ]
}
```

**Status Codes:**
- `200 OK`: Food log deleted
- `400 Bad Request`: Invalid index
- `401 Unauthorized`: Not authenticated
- `404 Not Found`: Log not found at specified index

---

### GET `/user/goals`

Get all goals for the authenticated user.

**Authentication:** Required

**Response:** `200 OK`
```json
{
  "goals": [
    {
      "primary_goals": ["weight_loss"],
      "secondary_goals": ["better_sleep", "more_energy"],
      "allergies": ["peanuts"],
      "activity_level": "moderately_active",
      "target_weight_kg": 70,
      "current_weight_kg": 75,
      "calories": 2000,
      "protein": 150,
      "carbohydrate": 200,
      "fat_total": 65,
      "fiber": 30,
      "sodium": 2300,
      "cholesterol": 300,
      "potassium": 3400,
      "vitamin_a": 900,
      "vitamin_c": 90,
      "vitamin_d": 15,
      "calcium": 1000,
      "iron": 8,
      "magnesium": 410
    }
  ],
  "current_goal_index": 0
}
```

**Status Codes:**
- `200 OK`: Goals retrieved
- `401 Unauthorized`: Not authenticated

---

### POST `/user/goals`

Create a new goal with auto-calculated nutrition targets.

**Authentication:** Required

**Request Body:**
```json
{
  "primary_goals": ["weight_loss"],
  "secondary_goals": ["better_sleep"],
  "allergies": ["peanuts", "shellfish"],
  "activity_level": "moderately_active",
  "target_weight_kg": 70,
  "current_weight_kg": 75
}
```

**Validation:**
- `primary_goals`: array of values from `["weight_loss", "muscle_gain", "maintenance", "recomposition", "improve_endurance", "improve_health"]`, required
- `secondary_goals`: array of values from `["better_sleep", "more_energy", "improve_mood", "improve_markers", "build_habits"]`, optional
- `allergies`: array of strings, optional
- `activity_level`: one of `["sedentary", "lightly_active", "moderately_active", "very_active", "extra_active"]`, required
- `target_weight_kg`: positive number, required
- `current_weight_kg`: positive number, required

**Behavior:**
- Calculates BMR based on health profile
- Calculates TDEE using activity level factor
- Auto-calculates nutrition targets based on primary goals and gender
- Sets gender-specific vitamin and mineral targets

**Response:** `201 Created`
```json
{
  "goals": [ ... ],
  "current_goal_index": 0
}
```

**Status Codes:**
- `201 Created`: Goal created
- `400 Bad Request`: Validation error or incomplete health profile
- `401 Unauthorized`: Not authenticated

---

### PATCH `/user/goals/:index`

Update an existing goal.

**Authentication:** Required

**URL Parameters:**
- `index`: 0-based index into the `goals` array

**Request Body:** (all fields optional)
```json
{
  "primary_goals": ["maintenance"],
  "secondary_goals": ["more_energy"],
  "allergies": ["dairy"],
  "activity_level": "very_active",
  "target_weight_kg": 72,
  "current_weight_kg": 74
}
```

**Response:** `200 OK`
```json
{
  "goals": [ ... ],
  "current_goal_index": 0
}
```

**Status Codes:**
- `200 OK`: Goal updated
- `400 Bad Request`: Validation error or invalid index
- `401 Unauthorized`: Not authenticated
- `404 Not Found`: Goal not found

---

### DELETE `/user/goals/:index`

Delete a goal by index.

**Authentication:** Required

**URL Parameters:**
- `index`: 0-based index into the `goals` array

**Example:** `DELETE /user/goals/1`

**Behavior:**
- Removes the goal
- Adjusts `current_goal_index` if necessary

**Response:** `200 OK`
```json
{
  "goals": [ ... ],
  "current_goal_index": 0
}
```

**Status Codes:**
- `200 OK`: Goal deleted
- `400 Bad Request`: Invalid index
- `401 Unauthorized`: Not authenticated
- `404 Not Found`: Goal not found

---

### PATCH `/user/goals/current`

Set the current active goal.

**Authentication:** Required

**Request Body:**
```json
{
  "index": 0
}
```

**Validation:**
- `index`: non-negative integer, required

**Response:** `200 OK`
```json
{
  "goals": [ ... ],
  "current_goal_index": 0
}
```

**Status Codes:**
- `200 OK`: Current goal set
- `400 Bad Request`: Validation error
- `401 Unauthorized`: Not authenticated
- `404 Not Found`: Invalid goal index

---

## Food Items

All food item routes are mounted at `/food-items` and require authentication.

### GET `/food-items`

List all food items (with optional search/filter).

**Authentication:** Required

**Query Parameters:**
- `search`: string, searches in name and tags (optional)
- `tag`: string, filter by tag (optional)
- `limit`: number, max results to return (optional, default: 50)
- `skip`: number, pagination offset (optional, default: 0)

**Example:** `GET /food-items?search=chicken&limit=10`

**Response:** `200 OK`
```json
{
  "foodItems": [
    {
      "id": "507f1f77bcf86cd799439011",
      "name": "Chicken Breast",
      "slug": "chicken-breast",
      "description": "Skinless, boneless chicken breast",
      "serving_quantity": 1,
      "serving_unit": "piece",
      "serving_weight_grams": 150,
      "metric_serving_amount": 100,
      "metric_serving_unit": "g",
      "calories": 165,
      "protein": 31,
      "carbohydrate": 0,
      "fat_total": 3.6,
      "fiber": 0,
      "sodium": 74,
      "vitamin_a": 0,
      "vitamin_c": 0,
      "vitamin_d": 0,
      "calcium": 15,
      "iron": 0.7,
      "magnesium": 29,
      "tags": ["protein", "meat", "poultry"],
      "allergens": [],
      "source": "User_Submission",
      "created_by": "507f1f77bcf86cd799439011",
      "createdAt": "2024-01-15T10:30:00.000Z",
      "updatedAt": "2024-01-15T10:30:00.000Z"
    }
  ],
  "total": 1
}
```

**Status Codes:**
- `200 OK`: Food items retrieved
- `401 Unauthorized`: Not authenticated

---

### GET `/food-items/:id`

Get a specific food item by ID.

**Authentication:** Required

**URL Parameters:**
- `id`: FoodItem ObjectId

**Example:** `GET /food-items/507f1f77bcf86cd799439011`

**Response:** `200 OK`
```json
{
  "foodItem": {
    "id": "507f1f77bcf86cd799439011",
    "name": "Chicken Breast",
    ...
  }
}
```

**Status Codes:**
- `200 OK`: Food item retrieved
- `401 Unauthorized`: Not authenticated
- `404 Not Found`: Food item not found

---

### POST `/food-items`

Create a new food item.

**Authentication:** Required

**Request Body:**
```json
{
  "name": "Chicken Breast",
  "slug": "chicken-breast",
  "description": "Skinless, boneless chicken breast",
  "serving_quantity": 1,
  "serving_unit": "piece",
  "serving_weight_grams": 150,
  "metric_serving_amount": 100,
  "metric_serving_unit": "g",
  "calories": 165,
  "protein": 31,
  "carbohydrate": 0,
  "fat_total": 3.6,
  "fiber": 0,
  "sodium": 74,
  "vitamin_a": 0,
  "vitamin_c": 0,
  "vitamin_d": 0,
  "calcium": 15,
  "iron": 0.7,
  "magnesium": 29,
  "tags": ["protein", "meat", "poultry"],
  "allergens": [],
  "source": "User_Submission",
  "expiration_hours": 72,
  "price_per_unit_bdt": 250,
  "addToInventory": true
}
```

**Required Fields:**
- `name`, `slug`, `serving_quantity`, `serving_unit`, `serving_weight_grams`
- `metric_serving_amount`, `metric_serving_unit`
- `calories`, `protein`, `carbohydrate`, `fat_total`
- `expiration_hours`

**Optional Fields:**
- `description`, `fiber`, `sodium`, `cholesterol`, `potassium`
- All vitamin and mineral fields
- `tags`, `allergens`, `source`, `price_per_unit_bdt`, `image_url`
- `addToInventory`: if true, adds to user's inventory after creation

**Response:** `201 Created`
```json
{
  "foodItem": { ... },
  "message": "Food item created successfully"
}
```

**Status Codes:**
- `201 Created`: Food item created
- `400 Bad Request`: Validation error
- `401 Unauthorized`: Not authenticated

---

### PATCH `/food-items/:id`

Update an existing food item.

**Authentication:** Required (must be creator)

**URL Parameters:**
- `id`: FoodItem ObjectId

**Request Body:** (all fields optional, same structure as POST)

**Response:** `200 OK`
```json
{
  "foodItem": { ... },
  "message": "Food item updated successfully"
}
```

**Status Codes:**
- `200 OK`: Food item updated
- `400 Bad Request`: Validation error
- `401 Unauthorized`: Not authenticated
- `403 Forbidden`: Not the creator
- `404 Not Found`: Food item not found

---

### PATCH `/food-items/:id/image`

Upload or update food item image.

**Authentication:** Required (must be creator)

**Content-Type:** `multipart/form-data`

**URL Parameters:**
- `id`: FoodItem ObjectId

**Request Body (Form Data):**
- `image`: Image file

**Response:** `200 OK`
```json
{
  "message": "Food item image uploaded successfully",
  "imageUrl": "https://res.cloudinary.com/..."
}
```

**Status Codes:**
- `200 OK`: Image uploaded
- `400 Bad Request`: No image provided
- `401 Unauthorized`: Not authenticated
- `403 Forbidden`: Not the creator
- `404 Not Found`: Food item not found

---

### DELETE `/food-items/:id`

Delete a food item.

**Authentication:** Required (must be creator)

**URL Parameters:**
- `id`: FoodItem ObjectId

**Response:** `200 OK`
```json
{
  "message": "Food item deleted successfully"
}
```

**Status Codes:**
- `200 OK`: Food item deleted
- `401 Unauthorized`: Not authenticated
- `403 Forbidden`: Not the creator
- `404 Not Found`: Food item not found

---

## Inventory Management

All inventory routes are mounted at `/inventories` and require authentication.

### GET `/inventories`

Get the user's food inventory.

**Authentication:** Required

**Response:** `200 OK`
```json
{
  "inventory": {
    "id": "507f1f77bcf86cd799439011",
    "name": "My Inventory",
    "user": "507f1f77bcf86cd799439011",
    "items": [
      {
        "foodItem": {
          "id": "507f1f77bcf86cd799439012",
          "name": "Chicken Breast",
          ...
        },
        "addedAt": "2024-01-15T10:30:00.000Z"
      }
    ],
    "createdAt": "2024-01-10T10:30:00.000Z",
    "updatedAt": "2024-01-15T10:30:00.000Z"
  }
}
```

**Behavior:**
- Automatically creates inventory if user doesn't have one
- Populates food item details

**Status Codes:**
- `200 OK`: Inventory retrieved
- `401 Unauthorized`: Not authenticated

---

### PATCH `/inventories`

Update inventory name.

**Authentication:** Required

**Request Body:**
```json
{
  "name": "My Kitchen Inventory"
}
```

**Validation:**
- `name`: string, min 1 character, optional

**Response:** `200 OK`
```json
{
  "inventory": { ... },
  "message": "Inventory updated successfully"
}
```

**Status Codes:**
- `200 OK`: Inventory updated
- `400 Bad Request`: Validation error
- `401 Unauthorized`: Not authenticated
- `404 Not Found`: Inventory not found

---

### POST `/inventories/items`

Add a food item to the inventory.

**Authentication:** Required

**Request Body:**
```json
{
  "foodItemId": "507f1f77bcf86cd799439011"
}
```

**Validation:**
- `foodItemId`: valid FoodItem ObjectId, required

**Response:** `200 OK`
```json
{
  "inventory": { ... },
  "message": "Item added to inventory"
}
```

**Status Codes:**
- `200 OK`: Item added
- `400 Bad Request`: Validation error or item already in inventory
- `401 Unauthorized`: Not authenticated
- `404 Not Found`: Food item or inventory not found

---

### DELETE `/inventories/items/:foodItemId`

Remove a food item from the inventory.

**Authentication:** Required

**URL Parameters:**
- `foodItemId`: FoodItem ObjectId

**Example:** `DELETE /inventories/items/507f1f77bcf86cd799439011`

**Response:** `200 OK`
```json
{
  "inventory": { ... },
  "message": "Item removed from inventory"
}
```

**Status Codes:**
- `200 OK`: Item removed
- `400 Bad Request`: Item not in inventory
- `401 Unauthorized`: Not authenticated
- `404 Not Found`: Inventory not found

---

## Analytics

All analytics routes are mounted at `/analytics` and require authentication.

### GET `/analytics/single-day`

Get nutrition analytics for a single day.

**Authentication:** Required

**Request Body:**
```json
{
  "date": "2024-01-15"
}
```

**Validation:**
- `date`: date format, required

**Response:** `200 OK`
```json
{
  "date": "2024-01-15T00:00:00.000Z",
  "consumed": {
    "calories": 1850,
    "protein": 120,
    "carbohydrate": 180,
    "fat_total": 65,
    "fiber": 28,
    "sodium": 2100,
    "cholesterol": 250,
    "potassium": 3200,
    "vitamin_a": 850,
    "vitamin_c": 85,
    "vitamin_d": 12,
    "calcium": 950,
    "iron": 15,
    "magnesium": 380
  },
  "targets": {
    "calories": 2000,
    "protein": 150,
    "carbohydrate": 200,
    "fat_total": 65,
    "fiber": 30,
    "sodium": 2300,
    "cholesterol": 300,
    "potassium": 3400,
    "vitamin_a": 900,
    "vitamin_c": 90,
    "vitamin_d": 15,
    "calcium": 1000,
    "iron": 8,
    "magnesium": 410
  },
  "percentage": {
    "calories": 92.5,
    "protein": 80,
    ...
  },
  "logs": [ ... ]
}
```

**Behavior:**
- Fetches food logs for the specified date
- Populates food item details
- Calculates total nutrition consumed
- Compares against current goal targets
- Returns percentage of targets achieved

**Status Codes:**
- `200 OK`: Analytics retrieved
- `400 Bad Request`: Validation error
- `401 Unauthorized`: Not authenticated or user has no goals

---

## Using the API

### Client Configuration

- Send JSON bodies with `Content-Type: application/json` for all requests
- Configure your HTTP client to **send and receive cookies**:
  - Browser `fetch`: use `credentials: "include"`
  - Axios: use `withCredentials: true`
  - Example:
    ```javascript
    fetch('http://localhost:3000/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify({ email, password })
    });
    ```

### Authentication Flow

1. **Register or Login**: Call `/auth/register` or `/auth/login`
   - Server sets `access_token` and `refresh_token` cookies
2. **Make authenticated requests**: Browser automatically sends cookies
3. **Token expiry**: If access token expires, call `/auth/refresh`
4. **Logout**: Call `/auth/logout` to clear cookies

### File Uploads

For image upload endpoints:
- Use `Content-Type: multipart/form-data`
- Include the image file in a form field named `image`
- Example with FormData:
  ```javascript
  const formData = new FormData();
  formData.append('image', fileInput.files[0]);
  
  fetch('http://localhost:3000/user/profile-image', {
    method: 'PATCH',
    credentials: 'include',
    body: formData
  });
  ```

---

## Error Handling

All endpoints return consistent error responses:

### Validation Error (400)
```json
{
  "message": "Validation failed",
  "errors": {
    "fieldErrors": {
      "email": ["Invalid email format"],
      "password": ["String must contain at least 6 character(s)"]
    }
  }
}
```

### Unauthorized (401)
```json
{
  "message": "Unauthorized"
}
```

### Forbidden (403)
```json
{
  "message": "You don't have permission to perform this action"
}
```

### Not Found (404)
```json
{
  "message": "Resource not found"
}
```

### Server Error (500)
```json
{
  "message": "Internal server error"
}
```

---

## Data Models

### User
- Basic info: `fullName`, `email`, `password`
- `healthProfile`: Health metrics and biomarkers
- `foodLogs`: Array of consumed food entries
- `goals`: Array of nutrition goals
- `current_goal_index`: Active goal
- `inventories`: References to user's food inventories

### FoodItem
- Basic info: `name`, `slug`, `description`
- Serving info: quantities, units, weights
- Nutrition: macros, micros, vitamins, minerals
- Metadata: `tags`, `allergens`, `source`, `created_by`

### FoodInventory
- `name`: Inventory name
- `user`: Owner reference
- `items`: Array of food items with timestamps

### Health Profile
- Demographics: `birth_date`, `gender`, `height_cm`, `current_weight_kg`
- Body composition: fat percentage, circumferences
- Lifestyle: `activity_level_factor`, steps, sleep
- Biomarkers: glucose, HbA1c, blood pressure, cholesterol

### Goal
- Targets: weight, activity level
- Preferences: allergies, primary/secondary goals
- Nutrition targets: all macros, micros, vitamins, minerals (auto-calculated based on gender and goals)

---

## License

MIT

---

## Support

For issues or questions, please open an issue on the repository.
