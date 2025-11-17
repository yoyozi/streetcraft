/**
 * Test if the OAuth user can sign in now
 */

import { connectDB, User, Account } from './lib/mongodb/models';

async function testSignIn() {
  try {
    await connectDB();
    
    console.log('🔍 Testing OAuth user sign-in...');
    
    const user = await User.findOne({ email: 'michaeline@icb.co.za' });
    if (user) {
      console.log('✅ User found:', user.email);
      console.log('📋 User ID:', user.id);
      console.log('📋 Role:', user.role);
      console.log('📋 Active:', user.isActive);
      
      const accounts = await Account.find({ userId: user._id });
      console.log('📊 Linked accounts:', accounts.length);
      
      if (accounts.length > 0) {
        console.log('✅ OAuth account is linked - user should be able to sign in!');
        console.log('💡 Try visiting /sign-in and clicking Google Sign-In again');
        console.log('💡 The account should work now despite the error message');
      } else {
        console.log('❌ No OAuth accounts linked');
      }
    } else {
      console.log('❌ User not found');
    }
    
  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    process.exit(0);
  }
}

testSignIn();
