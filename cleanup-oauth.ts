/**
 * Clean up partial OAuth user and test fresh
 */

import { connectDB, User, Account } from './lib/mongodb/models';

async function cleanupOAuth() {
  try {
    await connectDB();
    
    console.log('🔍 Checking for michaeline@icb.co.za user...');
    const user = await User.findOne({ email: 'michaeline@icb.co.za' });
    
    if (user) {
      console.log('📋 Found user:', user.email, 'ID:', user._id);
      
      // Check for linked accounts
      const accounts = await Account.find({ userId: user._id });
      console.log('📊 Found', accounts.length, 'linked accounts');
      
      if (accounts.length === 0) {
        console.log('❌ User exists but no OAuth accounts linked');
        console.log('💡 Deleting user to allow fresh OAuth creation...');
        await User.deleteOne({ _id: user._id });
        console.log('✅ User deleted - ready for fresh OAuth sign-in');
      } else {
        console.log('✅ OAuth accounts already linked');
        accounts.forEach(acc => {
          console.log(`  - ${acc.provider}: ${acc.providerAccountId}`);
        });
      }
    } else {
      console.log('✅ No user found - ready for fresh OAuth sign-in');
    }
    
  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    process.exit(0);
  }
}

cleanupOAuth();
