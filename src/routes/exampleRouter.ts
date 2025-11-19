import { Router } from "express";
import { getExample } from "../controllers/exampleController";

const router = Router();

// GET /api/example
router.get("/", getExample);

export default router;
