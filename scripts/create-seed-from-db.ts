import { connectDB, Crafter, Product, Category } from '../lib/mongodb/models';
import { hashSync } from 'bcrypt-ts-edge';
import fs from 'fs';
import path from 'path';

async function createSeedFromDatabase() {
  try {
    await connectDB();
    
    // Fetch current database data
    const crafters = await Crafter.find({}).lean();
    const products = await Product.find({}).lean();
    const categories = await Category.find({}).lean();
    
    // Use original users from sample-data.ts (not from database)
    const originalUsers = [
      {
        name: 'adminUser',
        email: 'craig@yoyozi.com',
        password: hashSync('123456', 10),
        role: 'admin'
      },
      {
        name: 'userUser',
        email: 'craig@netsecurity.co.za',
        password: hashSync('123456', 10),
        role: 'user'
      }
    ];
    
    // Process categories with defaults
    const processedCategories = categories.map(cat => ({
      name: cat.name,
      description: cat.description,
      isActive: cat.isActive ?? true
    }));
    
    // Process crafters with defaults
    const processedCrafters = crafters.map(crafter => ({
      name: crafter.name,
      location: crafter.location,
      mobile: crafter.mobile,
      profileImage: crafter.profileImage || null,
      isActive: crafter.isActive ?? true,
      products: [] // Will be populated with product IDs after creation
    }));
    
    // Process products with defaults
    const processedProducts = products.map(product => ({
      name: product.name,
      slug: product.slug,
      category: product.category,
      description: product.description,
      images: product.images,
      price: product.price,
      weight: product.weight ?? 0,
      availability: product.availability ?? 3,
      rating: product.rating ?? 0,
      numReviews: product.numReviews ?? 0,
      isFeatured: product.isFeatured ?? false,
      isFirstPage: product.isFirstPage ?? false,
      banner: product.banner || null,
      crafter: product.crafter || null,
      tags: product.tags || [],
      crafters: [] // Will be populated with crafter IDs after creation
    }));
    
    // Create sample data object
    const sampleData = {
      users: originalUsers,
      categories: processedCategories,
      crafters: processedCrafters,
      products: processedProducts,
    };
    
    // Generate the seed file content
    const fileContent = `// we need to import the bcrypt-ts-edge package to synchronise the hash from pw
import { hashSync } from "bcrypt-ts-edge";

const sampleData = ${JSON.stringify(sampleData, null, 2)};

export default sampleData;`;
    
    // Write to sample-data-01.ts
    const outputPath = path.join(process.cwd(), 'db', 'sample-data-01.ts');
    fs.writeFileSync(outputPath, fileContent, 'utf8');
    
    console.log(`✅ Seed file created successfully: ${outputPath}`);
    console.log(`📊 Data summary:`);
    console.log(`   - Users: ${originalUsers.length} (from original sample data)`);
    console.log(`   - Categories: ${processedCategories.length}`);
    console.log(`   - Crafters: ${processedCrafters.length}`);
    console.log(`   - Products: ${processedProducts.length}`);
    
    // List crafter names
    if (processedCrafters.length > 0) {
      console.log(`\n👨‍🎨 Crafters found in database:`);
      processedCrafters.forEach(c => console.log(`   - ${c.name}`));
    }
    
  } catch (error) {
    console.error('❌ Error creating seed file:', error);
  } finally {
    process.exit(0);
  }
}

createSeedFromDatabase();
