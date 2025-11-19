import { Router } from "express";
import { login, logout, register } from "../controllers/authController";
import { authMiddleware } from "../middleware/auth";

const router = Router();

// POST /api/auth/register
router.post("/register", register);

// POST /api/auth/login
router.post("/login", login);

// POST /api/auth/logout (protected so we only log out an authenticated user)
router.post("/logout", authMiddleware, logout);

export default router;
