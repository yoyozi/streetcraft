// eslint.config.mjs
import { dirname } from "path";
import { fileURLToPath } from "url";
import { FlatCompat } from "@eslint/eslintrc";

// Resolve __dirname in ESM
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Initialize FlatCompat to support legacy extends like Next.js configs
const compat = new FlatCompat({
  baseDirectory: __dirname,
});

// Assign config to a variable before exporting to remove "anonymous default export" warning
const eslintConfig = [
  // ✅ Global ignores (these apply everywhere, not just inside rules)
  {
    ignores: [
      "**/node_modules/**",
      ".next/**",
      "out/**",
      "build/**",
      "next-env.d.ts",
      "lib/generated/**",     // Prisma generated client
      "prisma/migrations/**", // Prisma migrations
      "public/**",
      "assets/**",
    ],
  },

  // ✅ Next.js recommended configs
  ...compat.extends("next/core-web-vitals", "next/typescript"),

  // ✅ Your custom rules
  {
    rules: {
      // Disable noisy rules for generated / legacy code
      "@typescript-eslint/no-unused-expressions": "off",
      "@typescript-eslint/no-this-alias": "off",
      "@typescript-eslint/no-require-imports": "off", // optional: let prisma's require() slide
      "@typescript-eslint/triple-slash-reference": "off", // silence next-env.d.ts error
    },
  },

  // ✅ Test overrides: allow "any" in test files so lint doesn't block CI
  {
    files: ["lib/__tests__/**/*.{ts,tsx}"],
    rules: {
      "@typescript-eslint/no-explicit-any": "off",
      "react/no-unescaped-entities": "off",
      "@next/next/no-img-element": "off",
    },
  },

  // ✅ Server-side overrides: allow "any" in actions, Mongo models, and utils for now
  // This prevents ci:local from being blocked by typing debt in backend code.
  // You can tighten these later by removing or narrowing this override.
  {
    files: [
      "lib/actions/**/*.{ts,tsx}",
      "lib/mongodb/models/**/*.{ts,tsx}",
      "lib/utils.ts",
    ],
    rules: {
      "@typescript-eslint/no-explicit-any": "off",
    },
  },
];

export default eslintConfig;