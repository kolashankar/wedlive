const nextConfig = {
  output: 'standalone',
  images: {
    unoptimized: true,
    domains: ['api.telegram.org', 'localhost'],
  },
  experimental: {
    // Remove if not using Server Components
    serverComponentsExternalPackages: ['mongodb'],
  },
  // Fix for React hydration errors
  reactStrictMode: false, // Disable strict mode to prevent double mounting in development
  // Optimize production builds
  swcMinify: true,
  webpack(config, { dev, isServer }) {
    // Fix for "Module not found" errors
    config.resolve.fallback = {
      ...config.resolve.fallback,
      fs: false,
      net: false,
      tls: false,
    };

    if (dev) {
      // Reduce CPU/memory from file watching
      config.watchOptions = {
        poll: 2000, // check every 2 seconds
        aggregateTimeout: 300, // wait before rebuilding
        ignored: ['**/node_modules'],
      };
    }
    
    return config;
  },
  onDemandEntries: {
    maxInactiveAge: 10000,
    pagesBufferLength: 2,
  },
  async headers() {
    return [
      {
        source: "/(.*)",
        headers: [
          { key: "X-Frame-Options", value: "ALLOWALL" },
          { 
            key: "Content-Security-Policy", 
            value: "frame-ancestors *; connect-src 'self' * ws: wss: https: http: data: blob:;" 
          },
          { key: "Access-Control-Allow-Origin", value: process.env.CORS_ORIGINS || "*" },
          { key: "Access-Control-Allow-Methods", value: "GET, POST, PUT, DELETE, OPTIONS" },
          { key: "Access-Control-Allow-Headers", value: "*" },
        ],
      },
    ];
  },
};

module.exports = nextConfig;
