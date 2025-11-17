/**
 * Check database state for OAuth troubleshooting
 */

import { connectDB, User, Account } from './lib/mongodb/models';

async function checkDatabase() {
  try {
    await connectDB();
    
    console.log('🔍 Checking all users...');
    const users = await User.find({});
    console.log('📊 Total users:', users.length);
    
    users.forEach(user => {
      console.log(`  - ${user.email} (${user.role}) - Active: ${user.isActive}`);
    });
    
    console.log('\n🔍 Checking all accounts...');
    const accounts = await Account.find({}).populate('userId');
    console.log('📊 Total accounts:', accounts.length);
    
    accounts.forEach(account => {
      console.log(`  - ${account.provider}: ${account.providerAccountId} -> ${account.userId?.email}`);
    });
    
    console.log('\n🔍 Checking for michaeline@icb.co.za...');
    const user = await User.findOne({ email: 'michaeline@icb.co.za' });
    if (user) {
      console.log('❌ User still exists!');
      console.log('  ID:', user._id);
      console.log('  Created:', user.createdAt);
      
      const userAccounts = await Account.find({ userId: user._id });
      console.log('  Linked accounts:', userAccounts.length);
    } else {
      console.log('✅ User not found - clean');
    }
    
  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    process.exit(0);
  }
}

checkDatabase();
