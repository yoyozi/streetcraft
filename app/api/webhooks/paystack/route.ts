// PAYSTACK WEBHOOK - COMMENTED OUT DUE TO BUILD ISSUES
// Uncomment when environment variables are properly configured
// 
// This webhook handler is temporarily disabled because it requires
// PAYSTACK_SECRET_KEY environment variable which is not available during build
// 
// To re-enable:
// 1. Set up PAYSTACK_SECRET_KEY in your environment
// 2. Remove these comments and restore the original implementation

import { NextResponse } from 'next/server';

export async function POST() {
  return NextResponse.json(
    { 
      error: 'Paystack webhook is temporarily disabled' 
    },
    { status: 503 }
  );
}

export async function GET() {
  return NextResponse.json(
    { 
      error: 'Paystack webhook is temporarily disabled' 
    },
    { status: 503 }
  );
}