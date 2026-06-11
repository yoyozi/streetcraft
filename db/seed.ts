// run this file - "npx tsx ./db/seed"
// PostgreSQL/Prisma seed script for streetcraft application

import { PrismaClient, CrafterStatus } from '@prisma/client';
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
        await prisma.productImageUpload.deleteMany({});
        await prisma.crafterPayment.deleteMany({});
        await prisma.crafterPayout.deleteMany({});
        console.log('Cleared existing data');

        // Seed users (keyed by email for deterministic linking)
        const userByEmail = new Map<string, { id: string }>();
        for (const user of sampleData.users) {
            const created = await prisma.user.create({
                data: {
                    name: user.name,
                    email: user.email,
                    password: user.password ?? null,
                    role: user.role,
                },
            });
            userByEmail.set(user.email, created);
        }
        console.log(`Inserted ${userByEmail.size} users`);

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

        // Seed crafters (linked to users by email)
        const crafterByUserEmail = new Map<string, { id: string }>();
        let crafterCount = 0;
        for (const c of sampleData.crafters) {
            const user = c.userEmail ? userByEmail.get(c.userEmail) : null;
            if (!user) {
                console.warn(`No user found for crafter "${c.businessName}" (userEmail: ${c.userEmail}), skipping`);
                continue;
            }
            const created = await prisma.crafter.create({
                data: {
                    userId: user.id,
                    businessName: c.businessName,
                    description: c.description ?? null,
                    location: c.location,
                    mobile: c.mobile,
                    category: c.category ?? null,
                    whatsappNumber: c.whatsappNumber ?? null,
                    city: c.city ?? null,
                    province: c.province ?? null,
                    profileImage: c.profileImage ?? null,
                    workSamples: [...(c.workSamples ?? [])],
                    status: c.status as CrafterStatus,
                    identityVerified: c.identityVerified ?? false,
                    isActive: c.isActive,
                },
            });
            await prisma.user.update({
                where: { id: user.id },
                data: { crafterId: created.id },
            });
            if (c.userEmail) crafterByUserEmail.set(c.userEmail, created);
            crafterCount++;
        }
        console.log(`Inserted ${crafterCount} crafters`);

        // Seed products (linked to crafters by the crafter's user email)
        let productCount = 0;
        for (const p of sampleData.products) {
            const crafter = p.crafterUserEmail ? crafterByUserEmail.get(p.crafterUserEmail) : null;
            await prisma.product.create({
                data: {
                    name: p.name,
                    slug: p.slug,
                    category: p.category,
                    description: p.description,
                    images: [...(p.images ?? [])],
                    price: p.price,
                    costPrice: p.costPrice,
                    priceNeedsReview: p.priceNeedsReview ?? false,
                    weight: p.weight,
                    height: p.height,
                    width: p.width,
                    depth: p.depth,
                    availability: p.availability,
                    rating: p.rating,
                    numReviews: p.numReviews,
                    isFirstPage: p.isFirstPage,
                    isUnique: p.isUnique,
                    isActive: p.isActive,
                    banner: p.banner ?? null,
                    tags: [...(p.tags ?? [])],
                    crafterId: crafter?.id ?? null,
                },
            });
            productCount++;
        }
        console.log(`Inserted ${productCount} products`);

        console.log('Database seeded successfully');
    } catch (error) {
        console.error('Error seeding database:', error);
        process.exit(1);
    } finally {
        await prisma.$disconnect();
        process.exit(0);
    }
}

main();