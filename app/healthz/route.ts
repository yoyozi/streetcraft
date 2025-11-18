import { NextResponse } from 'next/server';

export async function GET() {
  // Optionally: add minimal checks (e.g., process uptime, env OK)
  return NextResponse.json({ status: 'ok' });
}