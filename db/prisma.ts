// Prisma client and Neon adapter via connection string
import { PrismaClient } from "@prisma/client";
import { PrismaNeon } from "@prisma/adapter-neon";

// Load the database connection string from environment
const connectionString = process.env.DATABASE_URL;

// Throw an error if DATABASE_URL is missing
if (!connectionString) throw new Error("❌ DATABASE_URL is not defined");

// Create Prisma adapter from connection string
const adapter = new PrismaNeon({ connectionString });

// Singleton pattern to prevent multiple PrismaClients in dev (Next.js hot reload)
const globalForPrisma = global as unknown as { prisma: PrismaClient };
export const prisma =
  globalForPrisma.prisma ||
  new PrismaClient({ adapter }).$extends({
    // Extend Prisma result objects: convert Decimal -> string automatically
    result: {
      product: {
        price: { compute: (p) => (p.price ? p.price.toString() : '0') },  // price Decimal -> string
        rating: { compute: (p) => (p.rating ? p.rating.toString() : '0') }, // rating Decimal -> string
      },
      cart: {
        itemsPrice: { compute: (c) => (c.itemsPrice ? c.itemsPrice.toString() : '0') },
        shippingPrice: { compute: (c) => (c.shippingPrice ? c.shippingPrice.toString() : '0') },
        taxPrice: { compute: (c) => (c.taxPrice ? c.taxPrice.toString() : '0') },
        totalPrice: { compute: (c) => (c.totalPrice ? c.totalPrice.toString() : '0') },
      },
      order: {
        itemsPrice: { compute: (o) => (o.itemsPrice ? o.itemsPrice.toString() : '0') },
        shippingPrice: { compute: (o) => (o.shippingPrice ? o.shippingPrice.toString() : '0') },
        taxPrice: { compute: (o) => (o.taxPrice ? o.taxPrice.toString() : '0') },
        totalPrice: { compute: (o) => (o.totalPrice ? o.totalPrice.toString() : '0') },
      },
      orderItem: {
        price: { compute: (oi) => (oi.price ? oi.price.toString() : '0') },
      },
    },
  });

// Store singleton in global for dev mode
if (process.env.NODE_ENV !== "production") globalForPrisma.prisma = prisma;




//import "dotenv/config";   // 👈 this loads .env automatically
// import { Pool, neonConfig } from '@neondatabase/serverless';
// import { PrismaNeon } from '@prisma/adapter-neon';
// import { PrismaClient } from '@prisma/client';
// import ws from 'ws';

// // Sets up WebSocket connections, which enables Neon to use WebSocket communication.
// neonConfig.webSocketConstructor = ws;
// //const connectionString = `${process.env.DATABASE_URL}`;
// const connectionString = process.env.DATABASE_URL;

// // Creates a new connection pool using the provided connection string, allowing multiple concurrent connections.
// const pool = new Pool({ connectionString });

// // Instantiates the Prisma adapter using the Neon connection pool to handle the connection between Prisma and Neon.
// const adapter = new PrismaNeon( pool );

// // Extends the PrismaClient with a custom result transformer to convert the price and rating fields to strings.
// export const prisma = new PrismaClient({ adapter }).$extends({
//   result: {
//     product: {
//       price: {
//         compute(product) {
//           return product.price.toString();
//         },
//       },
//       rating: {
//         compute(product) {
//           return product.rating.toString();
//         },
//       },
//     },
//   },
// });