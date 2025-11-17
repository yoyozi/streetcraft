// YOCO WEBHOOK - COMMENTED OUT DUE TO BUILD ISSUES
// Uncomment when environment variables are properly configured
// 
// This webhook handler is temporarily disabled because it requires
// YOCO_WEBHOOK_SECRET environment variable which is not available during build
// 
// To re-enable:
// 1. Set up YOCO_WEBHOOK_SECRET in your environment
// 2. Remove these comments and restore the original implementation

import { NextResponse } from 'next/server';

export async function POST() {
  return NextResponse.json(
    { 
      error: 'Yoco webhook is temporarily disabled' 
    },
    { status: 503 }
  );
}

export async function GET() {
  return NextResponse.json(
    { 
      error: 'Yoco webhook is temporarily disabled' 
    },
    { status: 503 }
  );
}
