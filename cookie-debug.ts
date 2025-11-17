/**
 * Debug script to show what cookies NextAuth creates and what should be removed
 */

import { cookies } from 'next/headers';

function debugCookies() {
  console.log('🍪 NextAuth Cookies Analysis:');
  console.log('================================');
  
  console.log('\n📋 Standard NextAuth v5 Cookies:');
  console.log('1. authjs.session-token - JWT session token');
  console.log('2. authjs.csrf-token - CSRF protection');
  console.log('3. authjs.callback-url - OAuth callback URL');
  console.log('4. authjs.pkce.code_verifier - PKCE for OAuth');
  console.log('5. __Secure-authjs.session-token - Secure version (HTTPS)');
  console.log('6. __Host-authjs.session-token - Host-specific version');
  
  console.log('\n🔍 Custom Application Cookies:');
  console.log('1. cart-session-id - Shopping cart session');
  console.log('2. user-preferences - User settings');
  console.log('3. theme-preference - UI theme choice');
  
  console.log('\n🧹 What NextAuth.signOut() Removes:');
  console.log('✅ authjs.session-token (JWT session)');
  console.log('✅ authjs.csrf-token (CSRF token)');
  console.log('✅ authjs.callback-url (OAuth state)');
  console.log('✅ authjs.pkce.code_verifier (OAuth PKCE)');
  console.log('✅ All NextAuth-specific cookies');
  
  console.log('\n❌ What NextAuth.signOut() Does NOT Remove:');
  console.log('❌ cart-session-id (Shopping cart)');
  console.log('❌ user-preferences (Settings)');
  console.log('❌ theme-preference (Theme)');
  console.log('❌ Any custom application cookies');
  
  console.log('\n💡 Recommended Sign-Out Implementation:');
  console.log('1. Call NextAuth.signOut() for authentication');
  console.log('2. Clear custom cookies if needed');
  console.log('3. Clear server-side session data');
  console.log('4. Redirect to home/login page');
  
  console.log('\n🔧 Current Implementation Analysis:');
  console.log('✅ Uses NextAuth.signOut() - Removes auth cookies');
  console.log('✅ Redirects to home page');
  console.log('⚠️  Does not clear custom cookies (cart, preferences)');
  console.log('💡 Consider if you want to preserve cart after sign-out');
}

debugCookies();
