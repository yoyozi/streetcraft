import { z } from 'zod';
import { PAYMENT_METHODS, USER_ROLES } from './constants';


// nullable means optional for banner
// Price: we create a constant for the price validations then we can use it in others validations
// see below for description of regex
const currency = z
  .string()
  .min(1, 'Price is required')
  .regex(/^\d+(?:\.\d{1,2})?$/, 'Price must be a number with up to two decimal places');

// the regex must match one or more digits then a dot the an optional two digits.
// ^ starts with
// \d digit
// + or more
// ()? what goes in here is optional
// \.\ the literal . must be between two backslashes
// d{1,2}? two digits OPTIONAL
// $ to end the regex



// -- Schema for signing in users
export const signInFormSchema = z.object({
    email: z.string().email("Invalid Email Address"),
    password: z.string().min(6, "Password must be at least six characters")
});



// -- Schema for signing up users the define at the end if true passes if not 
// error as an object with path being place to show 'message'
export const signUpFormSchema = z.object({
    name:z.string().min(3, 'Name must be at least three characters'),
    email: z.string().email("Invalid Email Address"),
    password: z.string().min(6, "Password must be at least six characters"),
    confirmPassword: z.string().min(6, "Confirm password, must be at least 6 characters")
}).refine((data) => data.password === data.confirmPassword, 
    {message: "Passwords don't match",
    path: ['confirmPassword']
});



// schema for our cart
export const cartItemSchema = z.object({
    productId: z.string().min(1, 'Product is required'),
    name: z.string().min(1, 'Name is required'),
    slug: z.string().min(1, 'Slug is required'),
    qty: z.number().int().nonnegative('Quantity must be a positive number'),
    image: z.string().min(1, 'Image is required'),
    price: currency
});



// Now the array of the above is what makes up the insertCartSchema
export const insertCartSchema = z.object({
    items: z.array(cartItemSchema),
    itemsPrice: currency,
    totalPrice: currency,
    shippingPrice: currency,
    taxPrice: currency,
    sessionCartId: z.string().min(1, 'Session cartId is required'),
    userId: z.string().optional().nullable(),
});  



// Schema for the shipping address
export const ShippingAddressSchema = z.object({
    fullName: z.string().min(3, 'Full name must be at least three characters'),
    streetAddress: z.string().min(3, 'Address must be at least three characters'),
    city: z.string().min(3, 'City must be at least three characters'),
    postalCode: z.string().min(3, 'State must be at least three characters'),
    country: z.string().min(3, 'Zip code must be at least three characters'),
    lat: z.number().optional(),
    lng: z.number().optional(),
});



// Schema for the payment method
export const PaymentMethodSchema = z.object({
    type: z.string().min(1, 'Payment method is required')
}).refine((data) => PAYMENT_METHODS.includes(data.type), {
    message: 'Invalid payment method',
    path: ['type']
})



// Schema for inserting order
export const insertOrderSchema = z.object({
    userId: z.string().min(1, 'User is required'),
    itemsPrice: currency,
    shippingPrice: currency,
    taxPrice: currency,
    totalPrice: currency,
    paymentMethod: z.string().refine((data) => PAYMENT_METHODS.includes(data), {
        message: 'Invalid payment method',
    }),
    shippingAddress: ShippingAddressSchema,
})



// Schema for inserting an order item
export const insertOrderItemSchema = z.object({
    productId: z.string().min(1, 'Product is required'),
    slug: z.string(),
    image: z.string(),
    name: z.string(),
    price: currency,
    qty: z.number(),
})



// Schema for items past back from paypal
export const paymentResultSchema = z.object({
    id: z.string(),
    status: z.string(),
    email_address: z.string(),
    pricePaid: z.string(),
    currency: z.string(), // 'USD' for PayPal, 'ZAR' for COD/EFT
})



// Schema for updating the user profile by the user
export const updateProfileSchema = z.object({
    name: z.string().min(3, 'Name must be at least three characters'),
    email: z.string().email("Invalid Email Address"),
})

// Update User Schema by admins
export const updateUserSchema = updateProfileSchema.extend({
    id: z.string().min(1, 'Id is required'),
    role: z.enum(USER_ROLES as [string, ...string[]]),
    isActive: z.boolean().optional(),
    password: z.string().optional(),
    requirePasswordReset: z.boolean().optional(),
})

// Schema for inserting a product by admin
export const insertProductSchema = z.object({
    name: z.string().min(3, 'Name must be at least 3 characters').max(100, 'Name must not exceed 100 characters'),
    slug: z.string().min(3, 'Slug must be at least 3 characters').max(100, 'Slug must not exceed 100 characters').regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, 'Slug must be lowercase with hyphens only'),
    category: z.string().min(2, 'Category must be at least 2 characters').max(50, 'Category must not exceed 50 characters'),
    description: z.string().min(10, 'Description must be at least 10 characters').max(2000, 'Description must not exceed 2000 characters'),
    images: z.array(z.string().url('Each image must be a valid URL')).min(1, 'Product must have at least one image').max(10, 'Maximum 10 images allowed'),
    isFeatured: z.boolean(),
    isFirstPage: z.boolean(),
    banner: z.string().url('Banner must be a valid URL').nullable(),
    price: currency,
    costPrice: currency,
    priceNeedsReview: z.boolean().optional().default(false),
    lastCostPriceUpdate: z.date().optional().nullable(),
    availability: z.number().int().min(-1, 'Availability must be -1 or greater').default(3),
    tags: z.array(z.string().min(1, 'Tag cannot be empty').max(30, 'Tag must not exceed 30 characters')).max(20, 'Maximum 20 tags allowed').default([]),
    crafter: z.string().nullable().optional(),
});


// Schema for updating a product by an admin
export const updateProductSchema = z.object({
    id: z.string().min(1, 'Id is required'),
    name: z.string().min(3, 'Name must be at least 3 characters').max(100, 'Name must not exceed 100 characters'),
    slug: z.string().min(3, 'Slug must be at least 3 characters').max(100, 'Slug must not exceed 100 characters').regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, 'Slug must be lowercase with hyphens only'),
    category: z.string().min(2, 'Category must be at least 2 characters').max(50, 'Category must not exceed 50 characters'),
    description: z.string().min(10, 'Description must be at least 10 characters').max(2000, 'Description must not exceed 2000 characters'),
    images: z.array(z.string()).min(0, 'Images can be empty for updates').max(10, 'Maximum 10 images allowed').optional(),
    isFeatured: z.boolean(),
    isFirstPage: z.boolean(),
    banner: z.string().nullable().optional(),
    price: currency,
    costPrice: currency,
    priceNeedsReview: z.boolean().optional(),
    lastCostPriceUpdate: z.date().optional().nullable(),
    availability: z.number().int().min(-1, 'Availability must be -1 or greater').optional(),
    tags: z.array(z.string().min(1, 'Tag cannot be empty').max(30, 'Tag must not exceed 30 characters')).max(20, 'Maximum 20 tags allowed').default([]),
    crafter: z.string().nullable().optional(),
});



// Insert Review Schema
export const insertReviewSchema = z.object({
    title: z.string().min(3, 'Title must be at least 3 characters'),
    description: z.string().min(3, 'Description must be at least 3 characters'),
    productId: z.string().min(1, 'Product is required'),
    userId: z.string().min(1, 'User is required'),
    rating: z.number().int().min(1, 'Rating must be at least 1').max(5, 'Rating must be at most 5'),
    isVerifiedPurchase: z.boolean(),
    deliveredAt: z.date(),
});

// Category Schema
export const categorySchema = z.object({
    name: z.string().min(3, 'Name must be at least 3 characters'),
    description: z.string().min(3, 'Description must be at least 3 characters'),
});
