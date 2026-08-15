import type { NextConfig } from "next";
import withPWA from "@ducanh2912/next-pwa";

const nextConfig: NextConfig = {
  typescript: {
    ignoreBuildErrors: true,
  },
  reactStrictMode: false,
};

export default withPWA({
  dest: "public",
  register: true,
  disable: process.env.NODE_ENV === "development",
  cacheOnFrontEndNav: false,  // 关闭前端导航缓存
  aggressiveFrontEndNavCaching: false,
  reloadOnOnline: true,
  workbox: {
    globPatterns: ["**/*.{js,css,svg,png,jpg,jpeg,gif,webp,woff,woff2}"],  // 不缓存html
    navigateFallback: null,  // 不使用离线回退
    maximumFileSizeToCacheInBytes: 5 * 1024 * 1024,
    skipWaiting: true,
    clientsClaim: true,
    cleanupOutdatedCaches: true,
    runtimeCaching: [
      {
        urlPattern: /^https?.*\/api\/.*/,
        handler: "NetworkOnly",
      },
      {
        urlPattern: /^https:\/\/.*\.supabase\.co\/.*/,
        handler: "NetworkOnly",
      },
      {
        urlPattern: /\.(?:js|css)$/,
        handler: "StaleWhileRevalidate",
        options: {
          cacheName: "static-resources",
        },
      },
    ],
  },
})(nextConfig);
