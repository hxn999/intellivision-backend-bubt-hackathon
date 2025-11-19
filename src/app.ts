import express, { Application, Request, Response } from "express";
import cookieParser from "cookie-parser";
import authRouter from "./routes/authRouter";
import userRouter from "./routes/userRouter";
import foodItemRouter from "./routes/foodItemRouter";
import inventoryRouter from "./routes/inventoryRouter";

const app: Application = express();

// Middleware
app.use(express.json());
app.use(cookieParser());

// Health check route
app.get("/health", (_req: Request, res: Response) => {
  res.status(200).json({ status: "ok" });
});

// API routes
app.use("/auth", authRouter);
app.use("/user", userRouter);
app.use("/food-items", foodItemRouter);
app.use("/inventories", inventoryRouter);

export default app;
