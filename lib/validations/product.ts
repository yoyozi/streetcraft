import { z } from "zod";

// Price: currency format with up to two decimal places
const currency = z
  .string()
  .min(1, "Price is required")
  .regex(/^\d+(?:\.\d{1,2})?$/, "Price must be a number with up to two decimal places");

// Schema for inserting a product by admin
export const insertProductSchema = z.object({
  name: z.string().min(3, "Name must be at least 3 characters").max(100, "Name must not exceed 100 characters"),
  slug: z
    .string()
    .min(3, "Slug must be at least 3 characters")
    .max(100, "Slug must not exceed 100 characters")
    .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, "Slug must be lowercase with hyphens only"),
  category: z.string().min(2, "Category must be at least 2 characters").max(50, "Category must not exceed 50 characters"),
  description: z.string().min(10, "Description must be at least 10 characters").max(2000, "Description must not exceed 2000 characters"),
  images: z.array(z.string().url("Each image must be a valid URL")).min(1, "Product must have at least one image").max(10, "Maximum 10 images allowed"),
  isFeatured: z.boolean(),
  isFirstPage: z.boolean(),
  banner: z.string().url("Banner must be a valid URL").nullable(),
  price: currency,
  costPrice: currency,
  priceNeedsReview: z.boolean().optional().default(false),
  lastCostPriceUpdate: z.date().optional().nullable(),
  availability: z.number().int().min(-1, "Availability must be -1 or greater").default(3),
  tags: z.array(z.string().min(1, "Tag cannot be empty").max(30, "Tag must not exceed 30 characters")).max(20, "Maximum 20 tags allowed").default([]),
  crafterId: z.string().nullable().optional(),
});

// Schema for updating a product by an admin
export const updateProductSchema = z.object({
  id: z.string().min(1, "Id is required"),
  name: z.string().min(3, "Name must be at least 3 characters").max(100, "Name must not exceed 100 characters"),
  slug: z
    .string()
    .min(3, "Slug must be at least 3 characters")
    .max(100, "Slug must not exceed 100 characters")
    .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, "Slug must be lowercase with hyphens only"),
  category: z.string().min(2, "Category must be at least 2 characters").max(50, "Category must not exceed 50 characters"),
  description: z.string().min(10, "Description must be at least 10 characters").max(2000, "Description must not exceed 2000 characters"),
  images: z.array(z.string()).min(0, "Images can be empty for updates").max(10, "Maximum 10 images allowed").optional(),
  isFeatured: z.boolean(),
  isFirstPage: z.boolean(),
  banner: z.string().nullable().optional(),
  price: currency,
  costPrice: currency,
  priceNeedsReview: z.boolean().optional(),
  lastCostPriceUpdate: z.date().optional().nullable(),
  availability: z.number().int().min(-1, "Availability must be -1 or greater").optional(),
  tags: z.array(z.string().min(1, "Tag cannot be empty").max(30, "Tag must not exceed 30 characters")).max(20, "Maximum 20 tags allowed").default([]),
  crafterId: z.string().nullable().optional(),
});

// Inferred types
export type InsertProductInput = z.infer<typeof insertProductSchema>;
export type UpdateProductInput = z.infer<typeof updateProductSchema>;
