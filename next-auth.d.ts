import type { DefaultSession, DefaultUser } from "next-auth";
import type { DefaultJWT } from "next-auth/jwt";

declare module "next-auth" {
    interface Session {
        user: {
            id: string;
            role: string;
            name?: string; // optional if it may be missing
            requirePasswordReset?: boolean;
        } & DefaultSession["user"];
    }

    interface User extends DefaultUser {
        role: string;
        name?: string;
        requirePasswordReset?: boolean;
    }
}

declare module "next-auth/jwt" {
    interface JWT extends DefaultJWT {
        sub: string;   // user ID, never undefined
        role: string;  // required, since you set it in jwt callback
        name?: string; // optional (for NO_NAME -> email fallback)
        requirePasswordReset?: boolean;
    }
}

