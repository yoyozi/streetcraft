// Determining types and getting Zod to give us runtime typing
// look at the validators file in the lib/validators for validations that we import here
import { z } from 'zod';
import { insertProductSchema, 
    insertCartSchema, 
    cartItemSchema, 
    ShippingAddressSchema, 
    insertOrderItemSchema, 
    insertOrderSchema, 
    paymentResultSchema,
    insertReviewSchema} from '@/lib/validators';


export type DbProduct = {
    id: string;
    name: string;
    slug: string;
    category: string;
    images: string[];
    brand: string;
    description: string;
    rating: number;
    numReviews: number;
    isFeatured: boolean;
    isFirstPage: boolean;
    banner: string | null;
    createdAt: Date;
};

export type Product = z.infer<typeof insertProductSchema> & {
    _id: string;
    id: string;
    rating: string;
    createdAt: string;
    images: string[];
    costPrice?: number;
};

export type Cart = z.infer<typeof insertCartSchema> 

export type CartItem = z.infer<typeof cartItemSchema> 

export type ShippingAddress = z.infer<typeof ShippingAddressSchema> 

export type ActionResponse = 
    | { success: true; message: string; redirectTo?: string }
    | { success: false; message: string };

export type Order = z.infer<typeof insertOrderSchema> & {
    id: string;
    createdAt: Date;
    isPaid: boolean;
    paidAt: Date | null;
    isDelivered: boolean;
    deliveredAt: Date | null;
    orderItems: OrderItem[];
    user: { name: string; email: string }
    paymentResult: PaymentResult;
    totalPriceUsd?: string;  // USD amount for PayPal transactions
    exchangeRate?: string;   // Exchange rate used at payment time
    eftEmailSent?: boolean;  // Track if EFT payment instructions were sent
    eftEmailSentAt?: Date | null;  // When EFT instructions were sent
};

export type OrderItem = z.infer<typeof insertOrderItemSchema>;

export type PaymentResult = z.infer<typeof paymentResultSchema>;

export type Review = z.infer<typeof insertReviewSchema> & {
    id: string;
    createdAt: Date;
    user: { name: string; email: string }
};

export type CrafterWithDetails = {
    _id: string;
    name: string;
    location: string;
    mobile: string;
    productCount: number;
    isActive: boolean;
    linkedUser?: { id: string; name: string; email: string } | null;
    createdAt?: string;
    updatedAt?: string;
};