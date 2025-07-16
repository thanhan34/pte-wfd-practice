/** @type {import('next').NextConfig} */
const nextConfig = {
  // Basic configuration for Vercel deployment
  trailingSlash: false,
  swcMinify: true,
  // App directory is stable in Next.js 13+
  experimental: {
    appDir: true
  },
  // Ensure proper routing
  async rewrites() {
    return [
      {
        source: '/',
        destination: '/',
      },
    ]
  },
}

module.exports = nextConfig
