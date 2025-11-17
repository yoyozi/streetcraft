/**
 * Test script to verify password authentication
 * Run this with: npx tsx test-password.ts
 */

import { connectDB, User } from './lib/mongodb/models';
import { compareSync } from 'bcrypt-ts-edge';

async function testPassword() {
  try {
    console.log('🔍 Testing password authentication...');
    await connectDB();

    const testEmail = 'craig@yoyozi.com';
    const testPassword = '123456'; // Try common passwords

    console.log(`\n🔍 Looking for user: ${testEmail}`);
    const user = await User.findOne({ email: testEmail });

    if (!user) {
      console.log('❌ User not found');
      return;
    }

    console.log('✅ User found');
    console.log(`📋 Email: ${user.email}`);
    console.log(`📋 Name: ${user.name}`);
    console.log(`📋 Role: ${user.role}`);
    console.log(`📋 Active: ${user.isActive}`);
    console.log(`🔐 Password Hash: ${user.password?.substring(0, 20)}...`);

    if (!user.password) {
      console.log('❌ User has no password');
      return;
    }

    console.log(`\n🔍 Testing password: "${testPassword}"`);
    const isMatch = compareSync(testPassword, user.password);
    console.log(`📊 Password match: ${isMatch}`);

    if (isMatch) {
      console.log('✅ Authentication would succeed!');
    } else {
      console.log('❌ Authentication would fail');
      console.log('💡 Try different passwords or check the hash');
    }

    // Try some common passwords
    const commonPasswords = ['123456', 'password', 'admin', 'test', 'craig'];
    console.log('\n🔍 Testing common passwords...');
    
    for (const pwd of commonPasswords) {
      const match = compareSync(pwd, user.password);
      if (match) {
        console.log(`✅ Found matching password: "${pwd}"`);
        break;
      }
    }

  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    process.exit(0);
  }
}

testPassword();
