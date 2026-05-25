import { z } from "zod";
import { PAYMENT_METHODS } from "@/lib/constants";

const currency = z
  .string()
  .min(1, "Price is required")
  .regex(/^\d+(?:\.\d{1,2})?$/, "Price must be a number with up to two decimal places");

// Schema for the shipping address
export const ShippingAddressSchema = z.object({
  fullName: z.string().min(3, "Full name must be at least three characters"),
  streetAddress: z.string().min(3, "Address must be at least three characters"),
  city: z.string().min(3, "City must be at least three characters"),
  postalCode: z.string().min(3, "Postal code must be at least three characters"),
  country: z.string().min(3, "Country must be at least three characters"),
  lat: z.number().optional(),
  lng: z.number().optional(),
});

// Schema for the payment method
export const PaymentMethodSchema = z
  .object({
    type: z.string().min(1, "Payment method is required"),
  })
  .refine((data) => PAYMENT_METHODS.includes(data.type), {
    message: "Invalid payment method",
    path: ["type"],
  });

// Schema for inserting order
export const insertOrderSchema = z.object({
  userId: z.string().min(1, "User is required"),
  itemsPrice: currency,
  shippingPrice: currency,
  taxPrice: currency,
  totalPrice: currency,
  paymentMethod: z.string().refine((data) => PAYMENT_METHODS.includes(data), {
    message: "Invalid payment method",
  }),
  shippingAddress: ShippingAddressSchema,
});

// Schema for inserting an order item
export const insertOrderItemSchema = z.object({
  productId: z.string().min(1, "Product is required"),
  slug: z.string(),
  image: z.string(),
  name: z.string(),
  price: currency,
  qty: z.number(),
});

// Schema for items passed back from payment providers
export const paymentResultSchema = z.object({
  id: z.string(),
  status: z.string(),
  email_address: z.string(),
  pricePaid: z.string(),
  currency: z.string(),
});

// Inferred types
export type ShippingAddress = z.infer<typeof ShippingAddressSchema>;
export type InsertOrderInput = z.infer<typeof insertOrderSchema>;
export type InsertOrderItemInput = z.infer<typeof insertOrderItemSchema>;
export type PaymentResult = z.infer<typeof paymentResultSchema>;
