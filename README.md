## Express + TypeScript Boilerplate

This is a minimal Express server written in TypeScript.

### Scripts

- **Development**: `npm run dev`  
  Starts the server with `ts-node-dev` on `http://localhost:3000` (default).

- **Build**: `npm run build`  
  Compiles TypeScript from `src` to JavaScript in `dist`.

- **Start (production)**: `npm start`  
  Runs the compiled server from `dist/index.js`.

### MongoDB / Mongoose

- The app uses **Mongoose** to connect to MongoDB.
- Configure the connection string via **`MONGODB_URI`** environment variable.  
  If not set, it falls back to `mongodb://127.0.0.1:27017/hackathon`.

### Endpoints

- **GET** `/health` – simple health-check endpoint returning `{ "status": "ok" }`.
