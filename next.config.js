/** @type {import('next').NextConfig} */
const nextConfig = {
  // App directory is now stable in Next.js 13+
  output: 'standalone',
  distDir: '.next',
  trailingSlash: false,
  experimental: {
    appDir: true
  }
}

module.exports = nextConfig
