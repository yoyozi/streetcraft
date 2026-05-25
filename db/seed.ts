// run this file - "npx tsx ./db/seed"
// PostgreSQL/Prisma seed script for streetcraft application

import { PrismaClient } from '@prisma/client';
import sampleData from './sample-data';

const prisma = new PrismaClient();

async function main() {
    try {
        console.log('Seeding PostgreSQL database via Prisma...');

        // Clear existing data (order matters due to foreign keys)
        await prisma.cartItem.deleteMany({});
        await prisma.cart.deleteMany({});
        await prisma.orderItem.deleteMany({});
        await prisma.order.deleteMany({});
        await prisma.review.deleteMany({});
        await prisma.product.deleteMany({});
        await prisma.category.deleteMany({});
        await prisma.session.deleteMany({});
        await prisma.account.deleteMany({});
        await prisma.crafter.deleteMany({});
        await prisma.user.deleteMany({});
        await prisma.verificationToken.deleteMany({});
        console.log('Cleared existing data');

        // Seed users
        const createdUsers = [];
        for (const user of sampleData.users) {
            const created = await prisma.user.create({
                data: {
                    name: user.name,
                    email: user.email,
                    password: user.password,
                    role: user.role,
                },
            });
            createdUsers.push(created);
        }
        console.log(`Inserted ${createdUsers.length} users`);

        // Seed categories
        const createdCategories = [];
        for (const cat of sampleData.categories) {
            const created = await prisma.category.create({
                data: {
                    name: cat.name,
                    description: cat.description,
                    isActive: cat.isActive,
                },
            });
            createdCategories.push(created);
        }
        console.log(`Inserted ${createdCategories.length} categories`);

        // Seed crafters (link to craft users)
        const craftUsers = createdUsers.filter(u => u.role === 'craft');
        const createdCrafters = [];
        for (let i = 0; i < sampleData.crafters.length; i++) {
            const crafterData = sampleData.crafters[i];
            const userId = craftUsers[i]?.id;
            if (!userId) {
                console.warn(`No craft user found for crafter index ${i}, skipping`);
                continue;
            }
            const created = await prisma.crafter.create({
                data: {
                    userId: userId,
                    businessName: crafterData.name,
                    location: crafterData.location,
                    mobile: crafterData.mobile,
                    profileImage: crafterData.profileImage || null,
                    status: 'APPROVED',
                    isActive: true,
                },
            });
            // Update user with crafterId
            await prisma.user.update({
                where: { id: userId },
                data: { crafterId: created.id },
            });
            createdCrafters.push(created);
        }
        console.log(`Inserted ${createdCrafters.length} crafters`);

        // Seed products
        const createdProducts = [];
        for (const prod of sampleData.products) {
            const created = await prisma.product.create({
                data: {
                    name: prod.name,
                    slug: prod.slug,
                    category: prod.category,
                    description: prod.description,
                    images: prod.images,
                    price: prod.price,
                    rating: prod.rating,
                    numReviews: prod.numReviews,
                    isFeatured: prod.isFeatured,
                    banner: prod.banner || null,
                    tags: prod.tags,
                    isActive: true,
                    isFirstPage: prod.isFeatured,
                },
            });
            createdProducts.push(created);
        }
        console.log(`Inserted ${createdProducts.length} products`);

        // Link crafters to products
        const charlesCrafter = createdCrafters[0];
        const leonardCrafter = createdCrafters[1];

        if (charlesCrafter) {
            await prisma.product.updateMany({
                where: { category: 'Material' },
                data: { crafterId: charlesCrafter.id },
            });
        }

        if (leonardCrafter) {
            await prisma.product.updateMany({
                where: { category: { in: ['Beadwork', 'Paintings'] } },
                data: { crafterId: leonardCrafter.id },
            });
        }

        console.log('Database seeded successfully');
        console.log('Charles Chitokoko supplies Material products');
        console.log('Leonard supplies Beadwork and Paintings products');
    } catch (error) {
        console.error('Error seeding database:', error);
        process.exit(1);
    } finally {
        await prisma.$disconnect();
        process.exit(0);
    }
}

main();