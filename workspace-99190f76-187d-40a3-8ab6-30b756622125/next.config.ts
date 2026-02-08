import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // REMOVED output: "export" - Can't use with API routes
  // Using default (server mode) instead
  images: {
    unoptimized: true,
  },
  /* config options here */
  typescript: {
    ignoreBuildErrors: true,
  },
  // Removed eslint from config - use CLI instead
  reactStrictMode: false,
};

export default nextConfig;
