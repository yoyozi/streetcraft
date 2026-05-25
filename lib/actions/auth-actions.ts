'use server';

import { auth } from "@/auth";
import { redirect } from "next/navigation";

export async function verifyAdmin() {
    const session = await auth();
    if (!session?.user || session.user.role !== 'admin') {
        redirect('/unauthorized');
    }
    return session;
}

export async function verifyCrafter() {
    const session = await auth();
    if (!session?.user || session.user.role !== 'craft') {
        redirect('/unauthorized');
    }
    return session;
}

// Helper to check admin authorization - returns result object instead of redirecting
export async function checkAdminAuth() {
  const session = await auth();
  if (!session || session.user?.role !== 'admin') {
    return { authorized: false as const, error: 'Unauthorized: Admin access required' };
  }
  return { authorized: true as const };
}
