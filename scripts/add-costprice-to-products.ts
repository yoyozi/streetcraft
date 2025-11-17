import { connectDB } from '@/lib/mongodb';
import Product from '@/lib/mongodb/models/Product';

/**
 * Migration script to add costPrice field to existing products
 * Run with: npx tsx scripts/add-costprice-to-products.ts
 */
async function addCostPriceToProducts() {
  try {
    console.log('Connecting to database...');
    await connectDB();
    
    console.log('Updating products without costPrice field...');
    
    // Update all products that don't have costPrice or have it as null/undefined
    const result = await Product.updateMany(
      { 
        $or: [
          { costPrice: { $exists: false } },
          { costPrice: null }
        ]
      },
      { 
        $set: { 
          costPrice: 0,
          priceNeedsReview: false,
          lastCostPriceUpdate: null
        } 
      }
    );
    
    console.log(`✅ Migration complete!`);
    console.log(`   - Products matched: ${result.matchedCount}`);
    console.log(`   - Products updated: ${result.modifiedCount}`);
    
    // Verify the update
    const sampleProducts = await Product.find({}).limit(5).select('name costPrice priceNeedsReview');
    console.log('\nSample products after migration:');
    sampleProducts.forEach(p => {
      console.log(`   - ${p.name}: costPrice=${p.costPrice}, priceNeedsReview=${p.priceNeedsReview}`);
    });
    
    process.exit(0);
  } catch (error) {
    console.error('❌ Migration failed:', error);
    process.exit(1);
  }
}

addCostPriceToProducts();
