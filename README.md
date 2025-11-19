## Express + TypeScript Backend

This is an Express + TypeScript backend with MongoDB/Mongoose, JWT auth, and Zod validation.

### Scripts

- **Development**: `npm run dev`  
  Starts the server with `ts-node-dev` (auto-reload) on `http://localhost:3000` (default).

- **Build**: `npm run build`  
  Compiles TypeScript from `src` to JavaScript in `dist`.

- **Start (production)**: `npm start`  
  Runs the compiled server from `dist/index.js`.

### Environment variables

- **`PORT`**: Port for HTTP server (default `3000` if not set).
- **`MONGODB_URI`**: MongoDB connection string.  
  Defaults to `mongodb://127.0.0.1:27017/hackathon` if not provided.
- **`JWT_SECRET`**: Secret for signing access tokens (required in production).
- **`JWT_REFRESH_SECRET`**: Secret for signing refresh tokens (falls back to `JWT_SECRET` if not set).
- **`NODE_ENV`**: Use `production` in prod to enable secure cookies.

### MongoDB / Mongoose

- Uses **Mongoose** to connect to MongoDB before starting the HTTP server.
- Connection config lives in `src/config/database.ts`.

### Production deployment

- **1. Build the app**

  - Run: `npm install`
  - Run: `npm run build`

- **2. Set environment variables**

  - At minimum set: `MONGODB_URI`, `JWT_SECRET`, `JWT_REFRESH_SECRET`, `NODE_ENV=production`, and optionally `PORT`.

- **3. Run the compiled server**

  - Direct: `npm start` (runs `node dist/index.js`).
  - Or with a process manager (recommended):
    - For example with `pm2`: `pm2 start dist/index.js --name hackathon-backend`.

- **4. Put behind a reverse proxy (optional but recommended)**
  - Use nginx/Traefik/etc. to terminate TLS and forward traffic to `http://localhost:PORT`.

### API documentation (summary)

- **Base URL**
  - In development: `http://localhost:3000`
  - Auth routes are mounted at `/auth`, user routes at `/user`, other APIs can use `/api/...`.

#### Health

- **GET** `/health`
  - **Description**: Health-check endpoint.
  - **Response**: `200` with `{ "status": "ok" }`.

#### Auth

- **POST** `/auth/register`

  - **Body**:
    - `fullName` (string, required, min 2)
    - `email` (string, required, valid email)
    - `password` (string, required, min 6)
  - **Behavior**:
    - Validates body with Zod (via middleware).
    - Hashes password with bcrypt.
    - Creates user.
    - Issues:
      - `access_token` (JWT, 7 days) as **httpOnly cookie**.
      - `refresh_token` (JWT, 30 days) as **httpOnly cookie**.
  - **Response**:
    - `201` with `{ user: { id, fullName, email } }`.

- **POST** `/auth/login`

  - **Body**:
    - `email`, `password` (same rules as above).
  - **Behavior**:
    - Validates body.
    - Verifies credentials.
    - On success sets `access_token` and `refresh_token` cookies (same as register).
  - **Response**:
    - `200` with `{ user: { id, fullName, email } }`.

- **POST** `/auth/logout`

  - **Auth**: Requires valid `access_token` cookie (via `authMiddleware`).
  - **Behavior**:
    - Clears `access_token` and `refresh_token` cookies.
  - **Response**:
    - `200` with `{ "message": "Logged out" }`.

- **POST** `/auth/refresh`
  - **Behavior**:
    - Reads `refresh_token` cookie.
    - Verifies refresh token and user.
    - Issues a new `access_token` httpOnly cookie (refresh token stays the same until expiry).
  - **Response**:
    - `200` with `{ "message": "Access token refreshed" }`.
    - `401` if refresh token is missing/invalid/expired.

#### User (protected – requires `access_token` cookie)

- **PUT** `/user/health-profile`
  - **Auth**: Requires valid `access_token` cookie.
  - **Body**:
    - `birth_date` (date/string, required)
    - `gender` (`"male"` | `"female"`, required)
    - `height_cm` (number, > 0)
    - `current_weight_kg` (number, > 0)
    - Optional body-composition & biomarker fields:
      - `body_fat_percentage`, `waist_circumference_cm`, `hip_circumference_cm`, `neck_circumference_cm`
      - `activity_level_factor`, `steps_daily_average`, `sleep_hours_average`
      - `blood_glucose_fasting`, `hba1c`, `blood_pressure_systolic`, `blood_pressure_diastolic`, `cholesterol_ldl`, `cholesterol_hdl`
  - **Behavior**: Overwrites the authenticated user's `healthProfile` with the provided data.
  - **Response**: `200` with `{ user: { id, fullName, email, healthProfile } }`.

- **PATCH** `/user/profile`
  - **Auth**: Requires valid `access_token` cookie.
  - **Body** (at least one of `fullName` or `newPassword`):
    - `fullName` (string, min 2, optional)
    - `currentPassword` (string, min 6, required if `newPassword` is present)
    - `newPassword` (string, min 6, optional)
  - **Behavior**:
    - Updates `fullName` if provided.
    - If `newPassword` is provided, verifies `currentPassword` and updates the password hash.
  - **Response**: `200` with `{ user: { id, fullName, email } }`.

- **POST** `/user/food-logs`
  - **Auth**: Requires valid `access_token` cookie.
  - **Body**:
    - `date` (date/string)
    - `time` (string, e.g. `"08:30"`)
    - `foodItemId` (string, existing `FoodItem` ObjectId)
    - `quantity` (number, > 0)
  - **Behavior**: Appends a new food log entry to the authenticated user's `foodLogs` array.
  - **Response**: `201` with `{ foodLogs: [...] }`.

- **DELETE** `/user/food-logs/:index`
  - **Auth**: Requires valid `access_token` cookie.
  - **Params**:
    - `index` (0-based index into the `foodLogs` array)
  - **Behavior**: Removes the specified log entry.
  - **Response**:
    - `200` with `{ deleted, foodLogs }`.
    - `404` if the index is out of range.

- **GET** `/user/goals`
  - **Auth**: Requires valid `access_token` cookie.
  - **Behavior**: Returns all goals for the authenticated user and the current goal index.
  - **Response**: `200` with `{ goals: [...], current_goal_index }` (null if none).

- **POST** `/user/goals`
  - **Auth**: Requires valid `access_token` cookie.
  - **Body**:
    - `primary_goals`: array of allowed values:  
      `["weight_loss","muscle_gain","maintenance","recomposition","improve_endurance","improve_health"]`
    - `secondary_goals` (optional array):  
      `["better_sleep","more_energy","improve_mood","improve_markers","build_habits"]`
    - `allergies` (optional array of strings)
    - `activity_level`: one of  
      `["sedentary","lightly_active","moderately_active","very_active","extra_active"]`
    - `target_weight_kg` (number, > 0)
    - `current_weight_kg` (number, > 0)
  - **Behavior**: Adds a new goal to `user.goals`. If it is the first goal, sets it as current.
  - **Response**: `201` with `{ goals, current_goal_index }`.

- **PATCH** `/user/goals/:index`
  - **Auth**: Requires valid `access_token` cookie.
  - **Params**:
    - `index` (0-based index into the `goals` array)
  - **Body** (all optional; same allowed values as create):
    - `primary_goals`, `secondary_goals`, `allergies`, `activity_level`, `target_weight_kg`, `current_weight_kg`
  - **Behavior**: Partially updates the specified goal.
  - **Response**:
    - `200` with `{ goals, current_goal_index }`.
    - `404` if the goal index is invalid.

- **DELETE** `/user/goals/:index`
  - **Auth**: Requires valid `access_token` cookie.
  - **Params**:
    - `index` (0-based index into the `goals` array)
  - **Behavior**: Removes the goal and re-adjusts `current_goal_index` if needed.
  - **Response**:
    - `200` with `{ goals, current_goal_index }`.
    - `404` if the goal index is invalid.

- **PATCH** `/user/goals/current`
  - **Auth**: Requires valid `access_token` cookie.
  - **Body**:
    - `index` (number, >= 0) – the index in `goals` to mark as current.
  - **Behavior**: Sets `current_goal_index` to the given index.
  - **Response**:
    - `200` with `{ goals, current_goal_index }`.
    - `404` if the index is out of range.

### Using the API (client notes)

- Send JSON bodies (`Content-Type: application/json`) for all POST endpoints.
- Ensure your HTTP client is configured to **send and receive cookies**:
  - Browser `fetch`: `credentials: "include"`.
  - Axios: `withCredentials: true`.
- For protected routes you add later, include the `authMiddleware` and the server will read `access_token` from the httpOnly cookie and attach `req.userId`.
