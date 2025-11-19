import { Request, Response } from "express";

export const getExample = (_req: Request, res: Response) => {
  res.status(200).json({ message: "Example controller response" });
};
