import type { NextConfig } from "next";
import path from "path";

const nextConfig: NextConfig = {
  basePath: "/plan",
  assetPrefix: undefined,
  turbopack: {
    root: process.cwd(),
  },
};

export default nextConfig;
