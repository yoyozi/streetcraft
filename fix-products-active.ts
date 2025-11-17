/**
 * Fix isActive field for all products
 */

import { connectDB, Product } from './lib/mongodb/models';

async function fixProductsActive() {
  try {
    await connectDB();
    
    console.log('🔧 Fixing isActive field for all products...');
    
    // Update all products to ensure isActive is a proper boolean
    const result = await Product.updateMany(
      {},
      { $set: { isActive: true } }
    );
    
    console.log(`✅ Updated ${result.modifiedCount} products`);
    
    // Verify the fix
    console.log('\n🔍 Verifying...');
    const allProducts = await Product.find({});
    console.log(`📊 Total products: ${allProducts.length}`);
    
    const activeProducts = await Product.find({ isActive: true });
    console.log(`✅ Active products: ${activeProducts.length}`);
    
    activeProducts.forEach(p => {
      console.log(`  - ${p.name} (isActive: ${p.isActive}, type: ${typeof p.isActive})`);
    });
    
  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    process.exit(0);
  }
}

fixProductsActive();
