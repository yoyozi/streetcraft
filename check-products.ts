/**
 * Check products in database
 */

import { connectDB, Product } from './lib/mongodb/models';

async function checkProducts() {
  try {
    await connectDB();
    
    console.log('🔍 Checking all products...');
    const products = await Product.find({});
    console.log('📊 Total products:', products.length);
    
    console.log('\n📦 Product Details:');
    products.forEach((product, index) => {
      console.log(`\n${index + 1}. ${product.name}`);
      console.log(`   - ID: ${product._id}`);
      console.log(`   - Slug: ${product.slug}`);
      console.log(`   - Category: ${product.category}`);
      console.log(`   - Price: R${product.price}`);
      console.log(`   - isActive: ${product.isActive} (type: ${typeof product.isActive})`);
      console.log(`   - isFeatured: ${product.isFeatured}`);
      console.log(`   - isFirstPage: ${product.isFirstPage}`);
    });
    
    console.log('\n🔍 Active products only:');
    const activeProducts = await Product.find({ isActive: true });
    console.log('📊 Active products:', activeProducts.length);
    activeProducts.forEach(p => {
      console.log(`  ✅ ${p.name} (${p.slug})`);
    });
    
    console.log('\n🔍 Inactive products:');
    const inactiveProducts = await Product.find({ isActive: false });
    console.log('📊 Inactive products:', inactiveProducts.length);
    inactiveProducts.forEach(p => {
      console.log(`  ❌ ${p.name} (${p.slug})`);
    });
    
  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    process.exit(0);
  }
}

checkProducts();
