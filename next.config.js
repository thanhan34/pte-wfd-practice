/** @type {import('next').NextConfig} */
const nextConfig = {
  // Minimal configuration for Vercel deployment
  trailingSlash: false,
  swcMinify: true,
  // App directory is stable in Next.js 13+
  experimental: {
    appDir: true
  }
}

module.exports = nextConfig
