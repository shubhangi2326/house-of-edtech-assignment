import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  typescript: {
    // TypeScript errors build ke waqt ignore honge
    ignoreBuildErrors: true,
  },
  eslint: {
    // ESLint errors build ke waqt ignore honge
    ignoreDuringBuilds: true,
  },
  experimental: {
    serverActions: {
      bodySizeLimit: "10mb",
    },
  },
};

export default nextConfig;