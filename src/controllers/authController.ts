import { Request, Response } from "express";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { User } from "../models/User";
import { FoodInventory } from "../models/FoodInventory";
import { LoginInput, RegisterInput } from "../validation/authSchemas";

const JWT_SECRET = process.env.JWT_SECRET || "dev_jwt_secret";
const JWT_EXPIRES_IN = "7d";
const REFRESH_SECRET = process.env.JWT_REFRESH_SECRET || JWT_SECRET;
const REFRESH_EXPIRES_IN = "30d";

const createAccessToken = (userId: string) =>
  jwt.sign({ userId }, JWT_SECRET, { expiresIn: JWT_EXPIRES_IN });

const createRefreshToken = (userId: string) =>
  jwt.sign({ userId, type: "refresh" }, REFRESH_SECRET, {
    expiresIn: REFRESH_EXPIRES_IN,
  });

const accessCookieOptions = {
  httpOnly: true,
  sameSite: "lax" as const,
  secure: process.env.NODE_ENV === "production",
  maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
};

const refreshCookieOptions = {
  httpOnly: true,
  sameSite: "lax" as const,
  secure: process.env.NODE_ENV === "production",
  maxAge: 30 * 24 * 60 * 60 * 1000, // 30 days
};

export const register = async (req: Request, res: Response) => {
  try {
    const body = req.body as RegisterInput;

    const existing = await User.findOne({ email: body.email });
    if (existing) {
      return res.status(409).json({ message: "Email already in use" });
    }

    const hashedPassword = await bcrypt.hash(body.password, 10);
    const user = await User.create({
      fullName: body.fullName,
      email: body.email,
      password: hashedPassword,
    });

    // Create default inventory for the user
    const inventory = await FoodInventory.create({
      name: "My Inventory",
      user: user._id,
    });

    // Update user with inventory reference
    user.inventory = inventory._id;
    await user.save();

    const accessToken = createAccessToken(user.id);
    const refreshToken = createRefreshToken(user.id);
    res.cookie("access_token", accessToken, accessCookieOptions);
    res.cookie("refresh_token", refreshToken, refreshCookieOptions);

    return res.status(201).json({
      user: {
        id: user.id,
        fullName: user.fullName,
        email: user.email,
        image_url: user.image_url,
      },
    });
  } catch (error) {
    // eslint-disable-next-line no-console
    console.error(error);
    return res.status(500).json({ message: "Internal server error" });
  }
};

export const login = async (req: Request, res: Response) => {
  try {
    const body = req.body as LoginInput;

    const user = await User.findOne({ email: body.email });
    if (!user) {
      return res.status(401).json({ message: "Invalid credentials" });
    }

    const isMatch = await bcrypt.compare(body.password, user.password);
    if (!isMatch) {
      return res.status(401).json({ message: "Invalid credentials" });
    }

    const accessToken = createAccessToken(user.id);
    const refreshToken = createRefreshToken(user.id);
    res.cookie("access_token", accessToken, accessCookieOptions);
    res.cookie("refresh_token", refreshToken, refreshCookieOptions);

    return res.status(200).json({
      user: {
        id: user.id,
        fullName: user.fullName,
        email: user.email,
        image_url: user.image_url,
      },
    });
  } catch (error) {
    // eslint-disable-next-line no-console
    console.error(error);
    return res.status(500).json({ message: "Internal server error" });
  }
};

export const logout = async (_req: Request, res: Response) => {
  res.clearCookie("access_token", {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
  });
  res.clearCookie("refresh_token", {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
  });

  return res.status(200).json({ message: "Logged out" });
};

interface RefreshPayload {
  userId: string;
  type?: string;
}

export const refreshAccessToken = async (req: Request, res: Response) => {
  try {
    const token = req.cookies?.refresh_token;

    if (!token) {
      return res.status(401).json({ message: "Missing refresh token" });
    }

    const payload = jwt.verify(token, REFRESH_SECRET) as RefreshPayload;

    if (payload.type && payload.type !== "refresh") {
      return res.status(401).json({ message: "Invalid refresh token" });
    }

    const user = await User.findById(payload.userId);
    if (!user) {
      return res.status(401).json({ message: "User not found" });
    }

    const accessToken = createAccessToken(user.id);
    res.cookie("access_token", accessToken, accessCookieOptions);

    return res.status(200).json({ message: "Access token refreshed" });
  } catch (error) {
    // eslint-disable-next-line no-console
    console.error(error);
    return res
      .status(401)
      .json({ message: "Invalid or expired refresh token" });
  }
};
