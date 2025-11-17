// run this file - "npx tsx ./db/seed"
// MongoDB seed script for streetcraft application

import { connectDB, Product, User, Account, Session, VerificationToken, Crafter, Category } from '../lib/mongodb/models';
import sampleData from './sample-data-01';

async function main() {
    try {
        // Connect to MongoDB
        await connectDB();
        console.log('Connected to MongoDB');

        // Clear existing data
        await Product.deleteMany({});
        await Account.deleteMany({});
        await Session.deleteMany({});
        await VerificationToken.deleteMany({});
        await User.deleteMany({});
        await Crafter.deleteMany({});
        await Category.deleteMany({});
        console.log('Cleared existing data');

        // Seed categories first
        const createdCategories = await Category.insertMany(sampleData.categories);
        console.log(`Inserted ${createdCategories.length} categories`);

        // Seed crafters
        const createdCrafters = await Crafter.insertMany(sampleData.crafters);
        console.log(`Inserted ${createdCrafters.length} crafters`);

        // Seed products
        const createdProducts = await Product.insertMany(sampleData.products);
        console.log(`Inserted ${createdProducts.length} products`);

        // Link crafters to products
        // Charles Chitokoko (Active Oxygen Crafts) supplies Material products
        const charlesCrafter = createdCrafters[0];
        const leonardCrafter = createdCrafters[1];

        
        // Update products with crafter references
        await Product.updateMany(
            { category: 'Material' },
            { crafter: charlesCrafter._id.toString() }
        );

        await Product.updateMany(
            { category: { $in: ['Beadwork', 'Paintings'] } },
            { crafter: leonardCrafter._id.toString() }
        );

        // Seed users
        await User.insertMany(sampleData.users);
        console.log(`Inserted ${sampleData.users.length} users`);

        console.log('Database seeded successfully');
        console.log('✅ Charles Chitokoko supplies Material products');
        console.log('✅ Leonard supplies Beadwork and Paintings products');
    } catch (error) {
        console.error('Error seeding database:', error);
        process.exit(1);
    } finally {
        process.exit(0);
    }
}

main();