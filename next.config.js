/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  output: 'standalone',
  images: {
    // These are the default device/image sizes provided by Next.js.  Leaving them here for easier experimentation.
    deviceSizes: [640, 750, 828, 1080, 1200, 1920, 2048, 3840],
    imageSizes: [16, 32, 48, 64, 96, 128, 256, 384],
    minimumCacheTTL: 60, // 60 seconds - this cannot be invalidated
    unoptimized: true,
  },
};

module.exports = nextConfig
