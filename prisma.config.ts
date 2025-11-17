import { defineConfig } from "@prisma/config";
import * as dotenv from "dotenv";
import * as path from "path";

// Load the .env file manually
dotenv.config({ path: path.resolve(__dirname, ".env") });

export default defineConfig({
    schema: "./prisma/schema.prisma",
    // dotenv: true, // optional now, since we load manually
});