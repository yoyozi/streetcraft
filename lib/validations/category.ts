import { z } from "zod";

// Category Schema
export const categorySchema = z.object({
  name: z.string().min(3, "Name must be at least 3 characters"),
  description: z.string().min(3, "Description must be at least 3 characters"),
});

// For updating — all fields optional
export const updateCategorySchema = categorySchema.partial();

// Inferred types
export type CreateCategoryInput = z.infer<typeof categorySchema>;
export type UpdateCategoryInput = z.infer<typeof updateCategorySchema>;
