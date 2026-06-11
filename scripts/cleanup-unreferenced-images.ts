import { prisma } from '@/lib/prisma';
import { UTApi } from 'uploadthing/server';

/**
 * Script to delete unreferenced images from UploadThing
 *
 * This script:
 * 1. Gets all files currently stored in UploadThing
 * 2. Gets all referenced images from the database
 * 3. Finds unreferenced files
 * 4. Deletes them from UploadThing
 *
 * Usage: npx tsx scripts/cleanup-unreferenced-images.ts
 */

async function cleanupUnreferencedImages() {
  console.log('🧹 Starting UploadThing cleanup...');

  try {
    const utapi = new UTApi();

    // Get all files from UploadThing
    console.log('📂 Fetching all files from UploadThing...');
    const files = await utapi.listFiles();
    console.log(`   Found ${files.length} files in UploadThing`);

    // Get all referenced images from database
    console.log('🔍 Fetching referenced images from database...');
    const referencedUrls = new Set<string>();

    // Get product images
    const products = await prisma.product.findMany({
      select: { images: true },
    });
    products.forEach(p => p.images.forEach(url => referencedUrls.add(url)));
    console.log(`   ${products.length} products with ${referencedUrls.size} image references`);

    // Get crafter work samples
    const crafters = await prisma.crafter.findMany({
      select: { workSamples: true },
    });
    crafters.forEach(c => c.workSamples.forEach(url => referencedUrls.add(url)));
    console.log(`   ${crafters.length} crafters with work samples`);

    // Get product image uploads (pending/approved/rejected)
    const imageUploads = await prisma.productImageUpload.findMany({
      select: { imageUrl: true },
    });
    imageUploads.forEach(u => referencedUrls.add(u.imageUrl));
    console.log(`   ${imageUploads.length} image uploads`);

    // Get profile images
    const users = await prisma.user.findMany({
      select: { image: true },
      where: { image: { not: null } },
    });
    users.forEach(u => u.image && referencedUrls.add(u.image));
    console.log(`   ${users.length} user profile images`);

    // Get crafter profile images
    const crafterProfiles = await prisma.crafter.findMany({
      select: { profileImage: true },
      where: { profileImage: { not: null } },
    });
    crafterProfiles.forEach(c => c.profileImage && referencedUrls.add(c.profileImage));
    console.log(`   ${crafterProfiles.length} crafter profile images`);

    console.log(`   Total referenced images: ${referencedUrls.size}`);

    // Find unreferenced files
    const unreferencedFiles = files.filter(file => !referencedUrls.has(file.url));
    console.log(`\n🗑️  Found ${unreferencedFiles.length} unreferenced files`);

    if (unreferencedFiles.length === 0) {
      console.log('✨ No cleanup needed!');
      return;
    }

    // Delete unreferenced files
    console.log('\n🗑️  Deleting unreferenced files...');
    const fileKeys = unreferencedFiles.map(f => f.key);
    
    const result = await utapi.deleteFiles(fileKeys);
    console.log(`   Deleted ${result.deleted.length} files`);

    if (result.deleted.length > 0) {
      console.log('\n📋 Deleted files:');
      result.deleted.forEach(file => {
        console.log(`   - ${file.url}`);
      });
    }

    console.log(`\n✅ Cleanup complete! Freed ${result.deleted.length} files`);
    console.log(`💰 Estimated storage saved: ${result.deleted.length * 4} MB (assuming 4MB per file)`);

  } catch (error) {
    console.error('❌ Error during cleanup:', error);
    process.exit(1);
  }
}

// Run the cleanup
cleanupUnreferencedImages()
  .then(() => {
    console.log('\n✨ Script completed successfully');
    process.exit(0);
  })
  .catch((error) => {
    console.error('\n❌ Script failed:', error);
    process.exit(1);
  });