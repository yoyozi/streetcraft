/**
 * Debug script to check database connection and users
 * Run this with: npx tsx debug-auth.ts
 */

import { connectDB, User } from './lib/mongodb/models';

async function debugAuth() {
  try {
    console.log('🔍 Connecting to database...');
    await connectDB();
    console.log('✅ Database connected successfully');

    console.log('\n🔍 Checking for users in database...');
    const users = await User.find({});
    console.log(`📊 Found ${users.length} users in database`);

    if (users.length > 0) {
      console.log('\n📋 User details:');
      users.forEach((user, index) => {
        console.log(`\n${index + 1}. Email: ${user.email}`);
        console.log(`   Name: ${user.name}`);
        console.log(`   Role: ${user.role}`);
        console.log(`   Active: ${user.isActive}`);
        console.log(`   Has Password: ${!!user.password}`);
        console.log(`   Created: ${user.createdAt}`);
      });
    } else {
      console.log('\n❌ No users found in database!');
      console.log('💡 You need to create some test users first.');
      console.log('💡 Try running: npm run seed');
    }

    console.log('\n🔍 Checking for admin user specifically...');
    const adminUser = await User.findOne({ role: 'admin' });
    if (adminUser) {
      console.log('✅ Admin user found:', adminUser.email);
    } else {
      console.log('❌ No admin user found!');
    }

  } catch (error) {
    console.error('❌ Database error:', error);
  } finally {
    process.exit(0);
  }
}

debugAuth();
