import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  reactStrictMode: false,
  serverExternalPackages: ["@prisma/client", "prisma"],
  // Ensure static files are properly handled
  trailingSlash: false,
  // PWA and static optimization
  generateEtags: false,
  poweredByHeader: false,
  // Build optimization (swcMinify is enabled by default in Next.js 15)
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
