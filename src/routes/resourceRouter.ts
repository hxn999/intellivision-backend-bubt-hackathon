import { Router } from "express";
import {
  createResource,
  deleteResource,
  getResource,
  getResourceRecommendations,
  listResources,
  updateResource,
} from "../controllers/resourceController";
import { authMiddleware } from "../middleware/auth";
import { validateBody } from "../middleware/validate";
import {
  createResourceSchema,
  updateResourceSchema,
} from "../validation/resourceSchemas";

const router = Router();

// All resource routes are protected
// router.use(authMiddleware);

// GET /resources/recommendations - Get personalized recommendations (must come before /:id)
router.get("/recommendations",authMiddleware, getResourceRecommendations);

// GET /resources - List all resources with filtering
router.get("/", listResources);

// GET /resources/:id - Get a single resource
router.get("/:id", getResource);

// POST /resources - Create a new resource
router.post("/", validateBody(createResourceSchema), createResource);

// PATCH /resources/:id - Update a resource
router.patch("/:id", validateBody(updateResourceSchema), updateResource);

// DELETE /resources/:id - Delete a resource
router.delete("/:id", deleteResource);

export default router;
