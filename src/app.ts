import express, { Application, Request, Response } from "express";
import cookieParser from "cookie-parser";
import exampleRouter from "./routes/exampleRouter";
import authRouter from "./routes/authRouter";

const app: Application = express();

// Middleware
app.use(express.json());
app.use(cookieParser());

// Health check route
app.get("/health", (_req: Request, res: Response) => {
  res.status(200).json({ status: "ok" });
});

// API routes
app.use("/api/example", exampleRouter);
app.use("/auth", authRouter);

export default app;
