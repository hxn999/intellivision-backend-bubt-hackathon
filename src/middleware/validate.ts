import { NextFunction, Request, Response } from "express";
import { ZodSchema, ZodError } from "zod";

export const validateBody =
  (schema: ZodSchema) => (req: Request, res: Response, next: NextFunction) => {
    try {
      const parsed = schema.parse(req.body);
      // overwrite body with parsed data to ensure types/shape are correct
      req.body = parsed;
      return next();
    } catch (error) {
      if (error instanceof ZodError) {
        return res.status(400).json({
          message: "Validation failed",
          errors: error.flatten(),
        });
      }

      return res.status(400).json({ message: "Invalid request body" });
    }
  };
