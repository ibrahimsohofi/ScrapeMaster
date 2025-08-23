/** @type {import('next').NextConfig} */
const nextConfig = {
  // Enable standalone build for Docker deployment
  output: 'standalone',

  // Optimize for production
  compress: true,
  poweredByHeader: false,

  // Disable ESLint during build in production
  eslint: {
    ignoreDuringBuilds: true,
  },

  // Disable TypeScript errors during build in production
  typescript: {
    ignoreBuildErrors: true,
  },

  // Environment variables
  env: {
    CUSTOM_KEY: process.env.CUSTOM_KEY,
  },

  // Webpack configuration
  webpack: (config, { dev, isServer }) => {
    // Production optimizations
    if (!dev && !isServer) {
      config.optimization.splitChunks = {
        chunks: 'all',
        cacheGroups: {
          default: false,
          vendors: false,
          vendor: {
            chunks: 'all',
            name: 'vendor',
            test: /node_modules/,
          },
        },
      };
    }

    return config;
  },

  // Headers for security
  async headers() {
    return [
      {
        source: '/(.*)',
        headers: [
          {
            key: 'X-Frame-Options',
            value: 'DENY',
          },
          {
            key: 'X-Content-Type-Options',
            value: 'nosniff',
          },
          {
            key: 'Referrer-Policy',
            value: 'strict-origin-when-cross-origin',
          },
        ],
      },
    ];
  },

  // Redirects
  async redirects() {
    return [
      {
        source: '/home',
        destination: '/',
        permanent: true,
      },
    ];
  },

  // Image optimization
  images: {
    domains: ['localhost'],
    formats: ['image/webp', 'image/avif'],
  },

  // Server external packages
  serverExternalPackages: ['@prisma/client'],

  // Experimental features for better Netlify compatibility
  experimental: {
    serverComponentsExternalPackages: ['@prisma/client'],
  },
};

module.exports = nextConfig
