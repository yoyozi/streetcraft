import { z } from "zod";

const currency = z
  .string()
  .min(1, "Price is required")
  .regex(/^\d+(?:\.\d{1,2})?$/, "Price must be a number with up to two decimal places");

// schema for our cart item
export const cartItemSchema = z.object({
  productId: z.string().min(1, "Product is required"),
  name: z.string().min(1, "Name is required"),
  slug: z.string().min(1, "Slug is required"),
  qty: z.number().int().nonnegative("Quantity must be a positive number"),
  image: z.string().min(1, "Image is required"),
  price: currency,
});

// the array of cart items makes up the insertCartSchema
export const insertCartSchema = z.object({
  items: z.array(cartItemSchema),
  itemsPrice: currency,
  totalPrice: currency,
  shippingPrice: currency,
  taxPrice: currency,
  sessionCartId: z.string().min(1, "Session cartId is required"),
  userId: z.string().optional().nullable(),
});

// Inferred types
export type CartItemInput = z.infer<typeof cartItemSchema>;
export type InsertCartInput = z.infer<typeof insertCartSchema>;
