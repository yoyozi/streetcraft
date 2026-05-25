import { z } from "zod";
import { USER_ROLES } from "@/lib/constants";

// -- Schema for signing in users
export const signInFormSchema = z.object({
  email: z.string().email("Invalid Email Address"),
  password: z.string().min(6, "Password must be at least six characters"),
});

// -- Schema for signing up users
export const signUpFormSchema = z
  .object({
    name: z.string().min(3, "Name must be at least three characters"),
    email: z.string().email("Invalid Email Address"),
    password: z.string().min(6, "Password must be at least six characters"),
    confirmPassword: z.string().min(6, "Confirm password, must be at least 6 characters"),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Passwords don't match",
    path: ["confirmPassword"],
  });

// Schema for updating the user profile by the user
export const updateProfileSchema = z.object({
  name: z.string().min(3, "Name must be at least three characters"),
  email: z.string().email("Invalid Email Address"),
});

// Update User Schema by admins
export const updateUserSchema = updateProfileSchema.extend({
  id: z.string().min(1, "Id is required"),
  role: z.enum(USER_ROLES as [string, ...string[]]),
  isActive: z.boolean().optional(),
  password: z.string().optional(),
  requirePasswordReset: z.boolean().optional(),
});

// Inferred types
export type SignInInput = z.infer<typeof signInFormSchema>;
export type SignUpInput = z.infer<typeof signUpFormSchema>;
export type UpdateProfileInput = z.infer<typeof updateProfileSchema>;
export type UpdateUserInput = z.infer<typeof updateUserSchema>;
