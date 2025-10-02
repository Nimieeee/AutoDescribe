/** @type {import('next').NextConfig} */
const nextConfig = {
  // Optimized for Netlify deployment
  trailingSlash: true,
  images: {
    unoptimized: true
  },
  // Enable static optimization where possible
  experimental: {
    optimizeCss: true
  }
}

module.exports = nextConfig