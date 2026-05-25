/**
 * Authentication configuration for Streetcraft using NextAuth v5
 * 
 * This file configures:
 * - JWT-based session management
 * - Credentials provider for email/password authentication
 * - Google, Facebook, GitHub OAuth providers
 * - Prisma adapter for user/account/session management
 * - Custom callbacks for session and JWT token handling
 * - Cart linking on sign-in
 */

import NextAuth from 'next-auth';
import CredentialsProvider from 'next-auth/providers/credentials';
import GoogleProvider from 'next-auth/providers/google';
import FacebookProvider from 'next-auth/providers/facebook';
import GitHubProvider from 'next-auth/providers/github';
import { PrismaAdapter } from '@auth/prisma-adapter';
import { compareSync } from "bcrypt-ts-edge";
import { prisma } from './lib/prisma';
import { cookies } from 'next/headers';

// Lightweight types to improve safety in callbacks
type CartItemLite = {
  productId: string;
  qty: number;
  price: string | number;
};

type CartToken = {
  sub?: string;
  id?: string;
  role?: string;
  name?: string;
  email?: string;
  cartLinked?: boolean;
  // allow arbitrary extra fields from NextAuth
  [key: string]: unknown;
};

// NextAuth configuration export - provides handlers, auth, signIn, and signOut functions
export const { handlers, auth, signIn, signOut } = NextAuth({
  // Custom page routes for authentication
  pages: {
    signIn: '/sign-in',    // Custom sign-in page
    error: '/sign-in',     // Redirect errors to sign-in page
  },
  
  // Session configuration
  session: {
    strategy: 'jwt',                    // Use JWT tokens instead of database sessions
    maxAge: 30 * 24 * 60 * 60,         // Session expires after 30 days (in seconds)
  },
  
  // Allow account linking for same email across different providers
  trustHost: true,
  
  // Prisma adapter for user/account/session management
  adapter: PrismaAdapter(prisma),
  // Authentication providers configuration
  providers: [
    // Email/Password credentials provider
    CredentialsProvider({
      // Define the credential fields expected from the sign-in form
      credentials: {
        email: { type: 'email' },
        password: { type: 'password' },
      },
      
      async authorize(credentials) {
        if (!credentials) return null;

        const user = await prisma.user.findUnique({
          where: { email: credentials.email as string },
        });

        if (!user || !user.isActive || !user.password) return null;

        const isMatch = compareSync(credentials.password as string, user.password);
        if (!isMatch) return null;

        return {
          id: user.id,
          name: user.name,
          email: user.email,
          role: user.role,
          requirePasswordReset: user.requirePasswordReset,
        };
      },
    }),

    // Google OAuth provider
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
      authorization: {
        params: {
          prompt: "consent",
          access_type: "offline",
          response_type: "code",
          scope: "openid email profile"
        }
      },
      allowDangerousEmailAccountLinking: true,
    }),

    // Facebook OAuth provider
    FacebookProvider({
      clientId: process.env.FACEBOOK_CLIENT_ID!,
      clientSecret: process.env.FACEBOOK_CLIENT_SECRET!,
    }),

    // GitHub OAuth provider
    GitHubProvider({
      clientId: process.env.GITHUB_CLIENT_ID!,
      clientSecret: process.env.GITHUB_CLIENT_SECRET!,
      allowDangerousEmailAccountLinking: true,
    }),
  ],
  // Callback functions for customizing authentication behavior
  callbacks: {
    /**
     * Session callback - runs whenever a session is checked
     * Used to add custom properties to the session object
     * @param session - The session object
     * @param token - The JWT token
     * @returns Modified session object or null if user is inactive
     */
    async session({ session, token }) {
      // Check if user is still active
      if (token.sub) {
        const user = await prisma.user.findUnique({
          where: { id: token.sub },
          select: { isActive: true },
        });

        if (!user || !user.isActive) {
          throw new Error('Account is inactive');
        }
      }

      if (token.sub) session.user.id = token.sub;
      if (token.role) session.user.role = token.role as string;
      if (token.requirePasswordReset !== undefined) {
        session.user.requirePasswordReset = token.requirePasswordReset as boolean;
      }
      if (token.name) session.user.name = token.name as string;

      return session;
    },

    /**
     * Redirect callback - controls where users are redirected after sign-in
     * Used to redirect users requiring password reset to the reset page
     */
    async redirect({ url, baseUrl }) {
      // If URL is the reset password page, allow it
      if (url.startsWith(baseUrl + '/reset-password')) {
        return url;
      }
      
      // If URL is relative, make it absolute
      if (url.startsWith('/')) {
        return `${baseUrl}${url}`;
      }
      
      // If URL is on the same origin, allow it
      if (new URL(url).origin === baseUrl) {
        return url;
      }
      
      // Otherwise redirect to base URL
      return baseUrl;
    },

    /**
     * JWT callback - runs whenever a JWT token is created, updated, or accessed
     * Used to add custom properties to the JWT token
     * @param token - The JWT token
     * @param user - User object (only present on sign-in)
     * @returns Modified token object
     */
    async jwt({ token, user, trigger, session }) {
      // If user object is present (happens during sign-in)
      if (user) {
        token.id = user.id;
        token.role = user.role;
        token.requirePasswordReset = user.requirePasswordReset || false;

        // Link/merge anonymous cart to this user on first sign-in
        try {
          if (!(token as CartToken).cartLinked) {
            const sessionCartId = (await cookies()).get("sessionCartId")?.value;

            if (sessionCartId) {
              const anonCart = await prisma.cart.findFirst({
                where: { sessionCartId },
                include: { items: true },
              });
              const userCart = await prisma.cart.findFirst({
                where: { userId: user.id! },
                include: { items: true },
              });

              if (anonCart) {
                const calcTotals = (items: CartItemLite[]) => {
                  const itemsPrice = items.reduce((acc, it) => acc + Number(it.price) * Number(it.qty), 0);
                  const shippingPrice = itemsPrice > 1000 ? 0 : 150;
                  const taxPrice = 0;
                  const totalPrice = itemsPrice + shippingPrice + taxPrice;
                  return { itemsPrice, shippingPrice, taxPrice, totalPrice };
                };

                if (userCart && userCart.id !== anonCart.id) {
                  // Merge anonymous cart into existing user cart
                  const mergedMap: Record<string, CartItemLite> = {};
                  const pushItem = (it: CartItemLite) => {
                    const key = it.productId;
                    if (!mergedMap[key]) {
                      mergedMap[key] = { ...it };
                    } else {
                      mergedMap[key].qty = Number(mergedMap[key].qty) + Number(it.qty);
                    }
                  };
                  anonCart.items.forEach(it => pushItem({ productId: it.productId, qty: it.qty, price: it.price }));
                  userCart.items.forEach(it => pushItem({ productId: it.productId, qty: it.qty, price: it.price }));
                  const mergedItems = Object.values(mergedMap);
                  const totals = calcTotals(mergedItems);

                  // Clear user cart items and re-create merged
                  await prisma.cartItem.deleteMany({ where: { cartId: userCart.id } });
                  for (const item of mergedItems) {
                    const srcItem = anonCart.items.find(i => i.productId === item.productId) ||
                                    userCart.items.find(i => i.productId === item.productId);
                    await prisma.cartItem.create({
                      data: {
                        cartId: userCart.id,
                        productId: item.productId,
                        qty: item.qty,
                        price: Number(item.price),
                        name: srcItem?.name || '',
                        slug: srcItem?.slug || '',
                        image: srcItem?.image || '',
                      },
                    });
                  }
                  await prisma.cart.update({
                    where: { id: userCart.id },
                    data: {
                      itemsPrice: totals.itemsPrice,
                      shippingPrice: totals.shippingPrice,
                      taxPrice: totals.taxPrice,
                      totalPrice: totals.totalPrice,
                    },
                  });
                  // Delete the anonymous cart
                  await prisma.cartItem.deleteMany({ where: { cartId: anonCart.id } });
                  await prisma.cart.delete({ where: { id: anonCart.id } });
                } else if (!userCart) {
                  // No user cart — attach anonymous cart to this user
                  await prisma.cart.update({
                    where: { id: anonCart.id },
                    data: { userId: user.id! },
                  });
                }

                (token as CartToken).cartLinked = true;
              } else {
                (token as CartToken).cartLinked = true;
              }
            } else {
              (token as CartToken).cartLinked = true;
            }
          }
        } catch (err) {
          console.error("[AUTH] Cart link/merge error:", err);
        }

        // Handle users with placeholder names
        if (user.name === "NO_NAME") {
          token.name = user.email!.split("@")[0];
          await prisma.user.update({
            where: { id: user.id! },
            data: { name: token.name as string },
          });
        }
      }

      // Handle session updates (e.g., name change) via useSession().update
      if (trigger === 'update') {
        if (session?.user?.name) {
          token.name = session.user.name;
        }
      }

      return token;
    },
  },
});

