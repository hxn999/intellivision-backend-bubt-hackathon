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
  - Auth routes are mounted at `/auth`, API routes can use `/api/...`.

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

### Using the API (client notes)

- Send JSON bodies (`Content-Type: application/json`) for all POST endpoints.
- Ensure your HTTP client is configured to **send and receive cookies**:
  - Browser `fetch`: `credentials: "include"`.
  - Axios: `withCredentials: true`.
- For protected routes you add later, include the `authMiddleware` and the server will read `access_token` from the httpOnly cookie and attach `req.userId`.
