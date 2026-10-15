import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  basePath: "/plan",
  assetPrefix: undefined,
  turbopack: {
    root: process.cwd(),
  },
};

export default nextConfig;
