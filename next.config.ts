import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
  typescript: {
    ignoreBuildErrors: true,
  },
  // 使用 Next.js 默认开发体验（启用热更新与自动重建）
  reactStrictMode: false,
  experimental: {
    optimizePackageImports: ['geist'],
  },
  // 禁用 lightningcss 以解决 Windows 兼容性问题（保留现有设置）
  compiler: {
    removeConsole: false,
  },
};

export default nextConfig;
