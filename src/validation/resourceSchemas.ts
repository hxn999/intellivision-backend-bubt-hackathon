import { z } from "zod";

export const createResourceSchema = z.object({
  title: z.string().min(1, "Title is required").trim(),
  tags: z.array(z.string()).default([]),
  content: z.string().min(1, "Content is required"),
  video_url: z.string().url("Invalid URL format").optional(),
  type: z.enum(["article", "video"],  "Type must be either 'article' or 'video'"),
});

export type CreateResourceInput = z.infer<typeof createResourceSchema>;

export const updateResourceSchema = z.object({
  title: z.string().min(1, "Title is required").trim().optional(),
  tags: z.array(z.string()).optional(),
  content: z.string().min(1, "Content is required").optional(),
  video_url: z.string().url("Invalid URL format").optional().nullable(),
  type: z.enum(["article", "video"]).optional(),
});

export type UpdateResourceInput = z.infer<typeof updateResourceSchema>;

export const getResourcesQuerySchema = z.object({
  type: z.enum(["article", "video"]).optional(),
  tag: z.string().optional(),
  search: z.string().optional(),
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().positive().max(100).default(10),
});

export type GetResourcesQueryInput = z.infer<typeof getResourcesQuerySchema>;
