import { handlers } from '@/auth';
export const { GET, POST } = handlers;

// app/api/auth/[...nextauth]/route.ts
// import NextAuth from "next-auth";
// import { authConfig } from "@/lib/auth"; // centralize config

// const handler = NextAuth(authConfig);
// export { handler as GET, handler as POST };