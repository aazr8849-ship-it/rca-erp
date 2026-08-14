import type { NextConfig } from "next";
import withPWA from "@ducanh2912/next-pwa";

const nextConfig: NextConfig = {
  output: "standalone",
  typescript: {
    ignoreBuildErrors: true,
  },
  reactStrictMode: false,
};

export default withPWA({
  dest: "public",
  register: true,
  disable: process.env.NODE_ENV === "development",
  cacheOnFrontEndNav: true,
  aggressiveFrontEndNavCaching: true,
  reloadOnOnline: true,
  workbox: {
    globPatterns: ["**/*.{js,css,html,svg,png,jpg,jpeg,gif,webp,woff,woff2}"],
    navigateFallback: "/",
    maximumFileSizeToCacheInBytes: 10 * 1024 * 1024, // 10MB
  },
})(nextConfig);
