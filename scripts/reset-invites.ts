/**
 * Reset crafter invites and their associated users/crafters for re-testing.
 * Run: npx tsx scripts/reset-invites.ts
 */

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  // Find all users created via invite (phone.local email pattern)
  const inviteUsers = await prisma.user.findMany({
    where: { email: { endsWith: '@phone.local' } },
    select: { id: true, name: true, email: true, crafterId: true },
  });

  console.log(`Found ${inviteUsers.length} invite-created user(s):`);
  inviteUsers.forEach((u) => console.log(`  - ${u.name} (${u.email})`));

  if (inviteUsers.length > 0) {
    const userIds = inviteUsers.map((u) => u.id);
    const crafterIds = inviteUsers.map((u) => u.crafterId).filter(Boolean) as string[];

    // Delete products belonging to these crafters
    if (crafterIds.length > 0) {
      const deleted = await prisma.product.deleteMany({
        where: { crafterId: { in: crafterIds } },
      });
      console.log(`Deleted ${deleted.count} product(s)`);
    }

    // Delete crafter records
    const deletedCrafters = await prisma.crafter.deleteMany({
      where: { userId: { in: userIds } },
    });
    console.log(`Deleted ${deletedCrafters.count} crafter(s)`);

    // Delete user records
    const deletedUsers = await prisma.user.deleteMany({
      where: { id: { in: userIds } },
    });
    console.log(`Deleted ${deletedUsers.count} user(s)`);
  }

  // Reset all invites
  const deletedInvites = await prisma.crafterInvite.deleteMany({});
  console.log(`Deleted ${deletedInvites.count} invite(s)`);

  // Clean up expired OTPs
  const deletedOtps = await prisma.otp.deleteMany({});
  console.log(`Deleted ${deletedOtps.count} OTP(s)`);

  console.log('\nDone. Ready to test invites again.');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => {
    prisma.$disconnect();
  });
