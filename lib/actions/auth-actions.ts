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
