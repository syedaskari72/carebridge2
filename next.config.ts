import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  experimental: {
    serverComponentsExternalPackages: ["@prisma/client", "prisma"],
  },
  // Ensure static files are properly handled
  trailingSlash: false,
  // PWA and static optimization
  generateEtags: false,
  poweredByHeader: false,
  // Build optimization
  swcMinify: true,
  // Ensure proper routing
  async redirects() {
    return [
      {
        source: '/home',
        destination: '/',
        permanent: true,
      },
    ];
  },
};

export default nextConfig;
