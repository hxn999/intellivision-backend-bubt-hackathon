import express, { Application, Request, Response } from "express";
import cookieParser from "cookie-parser";
import authRouter from "./routes/authRouter";
import userRouter from "./routes/userRouter";
import foodItemRouter from "./routes/foodItemRouter";
import inventoryRouter from "./routes/inventoryRouter";
import analyticsRouter from "./routes/analyticsRouter";
import resourceRouter from "./routes/resourceRouter";

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
app.use("/inventory", inventoryRouter);
app.use("/analytics", analyticsRouter);
app.use("/resources", resourceRouter);

export default app;
