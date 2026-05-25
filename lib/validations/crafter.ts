import { z } from "zod";

// Schema for creating a crafter (admin creates or application submission)
export const createCrafterSchema = z.object({
  businessName: z.string().min(1, "Business name is required"),
  description: z.string().optional(),
  location: z.string().min(1, "Location is required"),
  mobile: z.string().min(10, "Valid mobile number is required"),
  whatsappNumber: z.string().optional(),
  city: z.string().optional(),
  province: z.string().optional(),
  profileImage: z.string().optional(),
});

// Schema for updating a crafter (admin)
export const updateCrafterSchema = createCrafterSchema.partial();

// Inferred types
export type CreateCrafterInput = z.infer<typeof createCrafterSchema>;
export type UpdateCrafterInput = z.infer<typeof updateCrafterSchema>;
