import { Router } from "express";
import {
  login,
  logout,
  refreshAccessToken,
  register,
} from "../controllers/authController";
import { authMiddleware } from "../middleware/auth";
import { validateBody } from "../middleware/validate";
import { loginSchema, registerSchema } from "../validation/authSchemas";

const router = Router();

// POST /auth/register
router.post("/register", validateBody(registerSchema), register);

// POST /auth/login
router.post("/login", validateBody(loginSchema), login);

// POST /auth/logout (protected so we only log out an authenticated user)
router.post("/logout", authMiddleware, logout);

// POST /auth/refresh - uses refresh_token cookie to issue new access_token
router.post("/refresh", refreshAccessToken);

export default router;
