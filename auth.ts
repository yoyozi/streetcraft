/**
 * Authentication configuration for OzoneShop using NextAuth v5
 * 
 * This file configures:
 * - JWT-based session management
 * - Credentials provider for email/password authentication
 * - Google OAuth provider for Google account authentication
 * - Facebook OAuth provider for Facebook account authentication
 * - Custom MongoDB adapter for user management
 * - Custom callbacks for session and JWT token handling
 * - Middleware helper for session cart ID management
 */

import NextAuth from 'next-auth';
import CredentialsProvider from 'next-auth/providers/credentials';
import GoogleProvider from 'next-auth/providers/google';
import FacebookProvider from 'next-auth/providers/facebook';
import GitHubProvider from 'next-auth/providers/github';
import { compareSync } from "bcrypt-ts-edge";
import { connectDB, User, Account, Session, VerificationToken, Cart } from './lib/mongodb/models';
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
  
  // Database adapter for user management - Custom MongoDB Adapter
  adapter: {
    async createUser(user) {
      await connectDB();
      
      //console.log('[AUTH] 👤 Creating new OAuth user:', user.email);
      
      // Create new user from OAuth
      const newUser = await User.create({
        name: user.name || 'NO_NAME',
        email: user.email,
        image: user.image,
        role: 'user', // Default role for OAuth users
        isActive: true,
        // OAuth users don't have passwords
      });

      //console.log('[AUTH] ✅ Created new OAuth user:', newUser.email);
      return newUser;
    },

    async getUser(id) {
      await connectDB();
      const user = await User.findById(id);
      return user;
    },

    async getUserByEmail(email) {
      await connectDB();
      const user = await User.findOne({ email });
      return user;
    },

    async getUserByAccount({ providerAccountId, provider }) {
      await connectDB();
      const account = await Account.findOne({ providerAccountId, provider }).populate('userId');
      if (!account) return null;
      return account.userId;
    },

    async linkAccount(account) {
      await connectDB();
      
      //console.log('[AUTH] 🔗 Linking OAuth account:', account.provider, 'for user:', account.userId);
      
      // Store OAuth account information
      await Account.create({
        userId: account.userId,
        type: 'oauth',
        provider: account.provider,
        providerAccountId: account.providerAccountId,
        refresh_token: account.refresh_token,
        access_token: account.access_token,
        expires_at: account.expires_at,
        token_type: account.token_type,
        scope: account.scope,
        id_token: account.id_token,
        session_state: account.session_state,
      });
      
      //console.log('[AUTH] ✅ OAuth account linked successfully');
    },
    async unlinkAccount({ providerAccountId, provider }) {
      await connectDB();
      await Account.findOneAndDelete({ providerAccountId, provider });
    },
    async createSession({ sessionToken, userId, expires }) {
      await connectDB();
      const session = await Session.create({
        sessionToken,
        userId,
        expires,
      });
      return {
        sessionToken: session.sessionToken,
        userId: session.userId,
        expires: session.expires,
      };
    },
    async getSessionAndUser(sessionToken) {
      await connectDB();
      const session = await Session.findOne({ sessionToken }).populate('userId');
      if (!session) return null;
      const user = session.userId;
      return {
        session: {
          sessionToken: session.sessionToken,
          userId: session.userId,
          expires: session.expires,
        },
        user: {
          id: user.id,
          name: user.name,
          email: user.email,
          emailVerified: user.emailVerified,
          image: user.image,
          role: user.role,
        },
      };
    },
    async updateSession({ sessionToken, userId, expires }) {
      await connectDB();
      const session = await Session.findOneAndUpdate(
        { sessionToken },
        { userId, expires },
        { new: true }
      );
      return {
        sessionToken: session.sessionToken,
        userId: session.userId,
        expires: session.expires,
      };
    },
    async deleteSession(sessionToken) {
      await connectDB();
      await Session.findOneAndDelete({ sessionToken });
    },
    async createVerificationToken({ identifier, expires, token }) {
      await connectDB();
      const verificationToken = await VerificationToken.create({
        identifier,
        token,
        expires,
      });
      return {
        identifier: verificationToken.identifier,
        token: verificationToken.token,
        expires: verificationToken.expires,
      };
    },
    async useVerificationToken({ identifier, token }) {
      await connectDB();
      const verificationToken = await VerificationToken.findOneAndDelete({ identifier, token });
      if (!verificationToken) return null;
      return {
        identifier: verificationToken.identifier,
        token: verificationToken.token,
        expires: verificationToken.expires,
      };
    },
  },
  // Authentication providers configuration
  providers: [
    // Email/Password credentials provider
    CredentialsProvider({
      // Define the credential fields expected from the sign-in form
      credentials: {
        email: { type: 'email' },
        password: { type: 'password' },
      },
      
      /**
       * Authorization function - validates user credentials
       * @param credentials - Email and password from sign-in form
       * @returns User object if valid, null if invalid
       */
      async authorize(credentials) {
        // Validate that credentials were provided
        if (!credentials) {
          //console.log('[AUTH] ❌ No credentials provided');
          return null;
        }

        //console.log('[AUTH] 🔍 Attempting sign-in for email:', credentials.email);

        // Look up user by email in the database
        await connectDB();
        const user = await User.findOne({ email: credentials.email as string });

        // Check if user exists
        if (!user) {
          //console.log('[AUTH] ❌ User not found for email:', credentials.email);
          return null;
        }

        //console.log('[AUTH] ✅ User found:', user.email, 'Role:', user.role, 'Active:', user.isActive);

        // Check if user account is active
        if (!user.isActive) {
          //console.log('[AUTH] ❌ Login denied - user account is inactive:', user.email);
          return null;
        }

        // Check if user has a password set (some users might be OAuth-only)
        if (!user.password) {
          //console.log('[AUTH] ❌ User has no password set (OAuth-only account):', user.email);
          return null;
        }

        // Compare provided password with stored hash
        const isMatch = compareSync(credentials.password as string, user.password);

        if (!isMatch) {
          //console.log('[AUTH] ❌ Password mismatch for email:', credentials.email);
          return null;
        }
        
                //console.log('[AUTH] ✅ Authentication successful for:', user.email);
        
        // Check if user needs to reset password
        if (user.requirePasswordReset) {
          //console.log('[AUTH] 🔐 User requires password reset:', user.email);
          // Store user info in token for password reset flow
          return {
            id: user.id,
            name: user.name,
            email: user.email,
            role: user.role,
            requirePasswordReset: true,
          };
        }
        
        // Return user object for session creation
        return {
          id: user.id,
          name: user.name,
          email: user.email,
          role: user.role,
          requirePasswordReset: false,
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
        await connectDB();
        const user = await User.findById(token.sub).select('isActive');

        // If user is inactive, invalidate the session
        if (!user || !user.isActive) {
          //console.log('[AUTH] ❌ Session denied - user account is inactive:', token.email);
          throw new Error('Account is inactive');
        }
      }

      // Add user ID from token to session
      if (token.sub) {
        session.user.id = token.sub;
      }
      
      // Add user role from token to session
      if (token.role) {
        session.user.role = token.role as string;
      }

      // Add requirePasswordReset flag to session
      if (token.requirePasswordReset !== undefined) {
        session.user.requirePasswordReset = token.requirePasswordReset as boolean;
      }

      // Ensure session name reflects token.name (e.g., after update trigger)
      if (token.name) {
        session.user.name = token.name as string;
      }

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
      // console.log("[AUTH] 🎫 JWT callback triggered");
      
      // If user object is present (happens during sign-in)
      if (user) {
        // console.log("[AUTH] 👤 User object present - processing sign-in");
        // console.log("[AUTH] 📧 User email:", user.email);
        // console.log("[AUTH] 🏷️ User role:", user.role);
        
        // Add user properties to token
        token.id = user.id;
        token.role = user.role;
        token.requirePasswordReset = user.requirePasswordReset || false;
        // console.log("[AUTH] ✅ Added user data to token");

        // Link/merge anonymous cart (by sessionCartId) to this user on first sign-in
        try {
          // Avoid running cart linking multiple times on subsequent JWT calls
          if (!(token as CartToken).cartLinked) {
            // console.log("[AUTH] 🛒 Attempting to link anonymous cart to user...");
            const sessionCartId = (await cookies()).get("sessionCartId")?.value;
            // console.log("[AUTH] 🧾 sessionCartId from cookie:", sessionCartId);

            if (sessionCartId) {
              await connectDB();
              const anonCart = await Cart.findOne({ sessionCartId: sessionCartId });
              const userCart = await Cart.findOne({ userId: user.id });

              // console.log("[AUTH] 📦 anonCart:", anonCart ? { id: anonCart.id, userId: anonCart.userId } : null);
              // console.log("[AUTH] 📦 userCart:", userCart ? { id: userCart.id, userId: userCart.userId } : null);

              if (anonCart) {
                // Helper: calculate prices like in cart.actions.ts
                const calcTotals = (items: CartItemLite[]) => {
                  const itemsPrice = items.reduce((acc, it) => acc + Number(it.price) * Number(it.qty), 0);
                  const shippingPrice = itemsPrice > 1000 ? 0 : 150;
                  const taxPrice = 0;
                  const totalPrice = itemsPrice + shippingPrice + taxPrice;
                  return {
                    itemsPrice: itemsPrice.toFixed(2),
                    shippingPrice: shippingPrice.toFixed(2),
                    taxPrice: taxPrice.toFixed(2),
                    totalPrice: totalPrice.toFixed(2),
                  };
                };

                if (userCart && userCart.id !== anonCart.id) {
                  // console.log("[AUTH] 🔗 Merging anonymous cart into existing user cart");
                  const mergedMap: Record<string, CartItemLite> = {};
                  const pushItem = (it: CartItemLite) => {
                    const key = it.productId;
                    if (!mergedMap[key]) {
                      mergedMap[key] = { ...it };
                    } else {
                      mergedMap[key].qty = Number(mergedMap[key].qty) + Number(it.qty);
                    }
                  };
                  // Merge items from both carts
                  (anonCart.items as unknown[] as CartItemLite[]).forEach(pushItem);
                  (userCart.items as unknown[] as CartItemLite[]).forEach(pushItem);
                  const mergedItems: CartItemLite[] = Object.values(mergedMap);

                  // Recalculate totals
                  const totals = calcTotals(mergedItems);

                  await Cart.findByIdAndUpdate(userCart.id, {
                    items: mergedItems as unknown as object[],
                    itemsPrice: totals.itemsPrice,
                    shippingPrice: totals.shippingPrice,
                    taxPrice: totals.taxPrice,
                    totalPrice: totals.totalPrice,
                  });
                  await Cart.findByIdAndDelete(anonCart.id);
                  // console.log("[AUTH] ✅ Merge complete. Anonymous cart deleted, user cart updated");
                } else if (!userCart) {
                  // console.log("[AUTH] 👥 No existing user cart. Attaching anonymous cart to user");
                  await Cart.findByIdAndUpdate(anonCart.id, { userId: user.id });
                  // console.log("[AUTH] ✅ Anonymous cart is now the user's cart");
                } else {
                  // console.log("[AUTH] ℹ️ Nothing to merge: session cart already belongs to the user");
                }

                // Mark as linked to prevent re-execution
                (token as CartToken).cartLinked = true;
              } else {
                // console.log("[AUTH] 🚫 No anonymous cart found for sessionCartId; nothing to link");
                (token as CartToken).cartLinked = true; // prevent repeated attempts
              }
            } else {
              // console.log("[AUTH] 🚫 No sessionCartId cookie present during sign-in");
              (token as CartToken).cartLinked = true; // prevent repeated attempts
            }
          } else {
            // console.log("[AUTH] ⏭️ Cart linking skipped (already linked in this session)");
          }
        } catch (err) {
          console.error("[AUTH] ❗ Cart link/merge error:", err);
        }

        // Handle users with placeholder names
        if (user.name === "NO_NAME") {
          // console.log("[AUTH] 🔄 User has placeholder name, generating from email");
          // Generate name from email prefix
          token.name = user.email!.split("@")[0];
          
          // console.log("[AUTH] 💾 Updating user name in database:", token.name);
          // Update the database with the new name
          await connectDB();
          await User.findByIdAndUpdate(user.id, { name: token.name });
          // console.log("[AUTH] ✅ Database updated with new user name");
        }
      } else {
        // console.log("[AUTH] 🔄 Token refresh - no user object present");
      }

      // Handle session updates (e.g., name change) initiated via useSession().update
      if (trigger === 'update') {
        // console.log("[AUTH] 🔁 JWT update trigger received");
        if (session?.user?.name) {
          token.name = session.user.name;
          // console.log("[AUTH] ✏️ Token name updated from session update:", token.name);
        }
      }
      
      // console.log("[AUTH] 📤 Final token:", {
      //   sub: token.sub,
      //   id: token.id,
      //   name: token.name,
      //   email: token.email,
      //   role: token.role
      // });
      return token;
    },
  },
});


/*
 * ===================================================================
 * LEGACY CODE - COMMENTED OUT
 * ===================================================================
 * 
 * The code below represents the previous NextAuth configuration that
 * has been replaced by the current implementation above. This code is
 * kept for reference purposes and can be safely removed once the new
 * implementation is confirmed to be working correctly.
 * 
 * Key differences in the new implementation:
 * - Updated to NextAuth v5 syntax
 * - Improved error handling and logging
 * - Better TypeScript compatibility
 * - Cleaner callback structure
 * - Enhanced console logging for debugging
 * 
 * TODO: Remove this commented code block after confirming the new
 * implementation works correctly in production.
 * ===================================================================
 */