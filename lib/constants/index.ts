export const APP_NAME = process.env.NEXT_PUBLIC_APP_NAME || 'StreetCraft';
export const APP_DESCRIPTION =  process.env.NEXT_PUBLIC_APP_DESCRIPTION ||   'Source for great Ozone products';
export const SERVER_URL =  process.env.NEXT_PUBLIC_SERVER_URL || 'http://localhost:3000';

// To limit the number of items called for
export const LATEST_PRODUCTS_LIMIT = Number(process.env.LATEST_PRODUCTS_LIMIT) || 4;

// To limit the number of items on the first page
export const FIRST_PAGE_PRODUCTS_LIMIT = Number(process.env.FIRST_PAGE_PRODUCTS_LIMIT) || 4;

// Forms default values
export const signInDefaultValues = { 
    email: '',
    password: ''
};

// Forms default values
export const signUpDefaultValues = { 
    name: 'Your name',
    email: 'your@email.address',
    password: '',
    confirmPassword: ''
};

export const shippingAddressDefaultValues = { 
    fullName: '',
    streetAddress: '',
    city: '',
    postalCode: '',
    country: '',
};

export const productDefaultValues = {
    name: '',
    slug: '',
    category: '',
    images: [],
    description: '',
    price: '0',
    costPrice: '0',
    priceNeedsReview: false,
    availability: 3,
    tags: [],
    rating: '0',
    numReviews: '0',
    isFeatured: false,
    isFirstPage: false,
    banner: null,
    crafter: null,
};

export const reviewFormDefaultValues = {
    title: '',
    description: '',
    productId: '',
    userId: '',
    rating: 1,
    isVerifiedPurchase: false,
    deliveredAt: new Date(),
};

export const USER_ROLES = process.env.USER_ROLES ? process.env.USER_ROLES.split(', ') : ['admin', 'user', 'craft'];

export const PAYMENT_METHODS =process.env.PAYMENT_METHODS ? process.env.PAYMENT_METHODS.split(', ') : ['Yoco', 'PayPal', 'Paystack', 'EFT'];
export const DEFAULT_PAYMENT_METHOD = process.env.DEFAULT_PAYMENT_METHOD || 'EFT';

export const PAGE_SIZE = Number(process.env.PAGE_SIZE) || 12;

export const SENDER_EMAIL = process.env.SENDER_EMAIL || 'onboarding@resend.dev';

// EFT Banking Details
export const EFT_BANK_NAME = process.env.EFT_BANK_NAME || 'Bank Name';
export const EFT_ACCOUNT_NUMBER = process.env.EFT_ACCOUNT_NUMBER || '123456789';
export const EFT_BRANCH_CODE = process.env.EFT_BRANCH_CODE || '051001';
export const EFT_ACCOUNT_HOLDER = process.env.EFT_ACCOUNT_HOLDER || 'Ozone Shop (Pty) Ltd';

