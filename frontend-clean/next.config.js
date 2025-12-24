/** @type {import('next').NextConfig} */
const nextConfig = {
  // Optimized for Netlify deployment
  trailingSlash: true,
  images: {
    unoptimized: true
  },
  // Disable features not compatible with static export
  experimental: {
    missingSuspenseWithCSRBailout: false,
  },
  // Ensure proper static file handling
  assetPrefix: '',
  // Disable webpack cache for more reliable builds
  webpack: (config, { dev, isServer }) => {
    if (!dev && !isServer) {
      config.cache = false;
    }
    return config;
  },
  experimental: {
    missingSuspenseWithCSRBailout: false,
  },
  async rewrites() {
    return [
      {
        source: '/api/proxy/:path*',
        destination: 'http://164.68.122.165:3000/api/:path*',
      },
    ]
  },
}

module.exports = nextConfig